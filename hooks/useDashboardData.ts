import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export function useDashboardData() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace("/m/signin"); 

      setUser(session.user);
      
      const [res1, res2] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', session.user.id),
        supabase.from('orders_ops').select('*, procurement_items(product_name)').eq('customer_id', session.user.id)
      ]);

      const fmt1 = (res1.data||[]).map(o => ({ ...o, source: 'orders', itemsList: o.items||[] }));
      const fmt2 = (res2.data||[]).map(o => ({ ...o, display_id: o.order_display_id, source: 'orders_ops', itemsList: o.procurement_items||[] }));
      
      setOrders([...fmt1, ...fmt2].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setLoading(false);
    };
    fetch();
  }, [router]);

  const handleSignOut = async () => { 
    await supabase.auth.signOut(); 
    router.replace("/m/signin"); 
  };

  return { user, orders, loading, handleSignOut };
}
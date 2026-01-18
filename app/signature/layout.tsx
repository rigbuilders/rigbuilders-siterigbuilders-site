import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signature Series | The Flagship Experience",
  description: "Signature Series is our flagship Desktops series, featuring elite components, handcrafted builds, stress-tested performance, and premium aesthetics.",
};

export default function SignatureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
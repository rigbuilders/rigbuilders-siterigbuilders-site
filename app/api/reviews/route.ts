import { NextResponse } from 'next/server';

// FIX: This forces Next.js to fetch fresh data every time and stops aggressive caching!
export const dynamic = 'force-dynamic';

export async function GET() {
  const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!placeId || !apiKey) {
    return NextResponse.json({ error: 'Missing API credentials' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`
    );
    
    const data = await response.json();
    
    // DEBUGGING: This will print the exact Google data in your VS Code terminal!
    // Check your terminal to verify if Google is actually sending the text and photos.
    console.log("GOOGLE REVIEWS DATA:", JSON.stringify(data.result?.reviews, null, 2));
    
    return NextResponse.json(data.result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
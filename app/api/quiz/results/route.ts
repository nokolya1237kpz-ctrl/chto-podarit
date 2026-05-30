import { NextRequest, NextResponse } from 'next/server';
import { answersFromSearchParams, getRecommendationResponse } from '@features/gift-quiz/lib/recommendationApi';

export async function GET(request: NextRequest) {
  return NextResponse.json(await getRecommendationResponse(answersFromSearchParams(new URL(request.url).searchParams)));
}

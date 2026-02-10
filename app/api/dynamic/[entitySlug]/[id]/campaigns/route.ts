import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { id: recordId } = await params;
  await getSession();
  const links = await prisma.recordCampaign.findMany({
    where: { recordId },
    include: { campaign: true },
  });
  return NextResponse.json(links.map((l) => l.campaign));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { id: recordId } = await params;
  await getSession();
  const record = await prisma.dynamicRecord.findUnique({ where: { id: recordId } });
  if (!record) return NextResponse.json({ error: "רשומה לא נמצאה" }, { status: 404 });
  const body = await req.json();
  const { campaignId } = body;
  if (!campaignId) return NextResponse.json({ error: "חסר campaignId" }, { status: 400 });
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return NextResponse.json({ error: "קמפיין לא נמצא" }, { status: 404 });
  await prisma.recordCampaign.upsert({
    where: { recordId_campaignId: { recordId, campaignId } },
    create: { recordId, campaignId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string; id: string }> }
) {
  const { id: recordId } = await params;
  await getSession();
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");
  if (!campaignId) return NextResponse.json({ error: "חסר campaignId" }, { status: 400 });
  await prisma.recordCampaign.deleteMany({ where: { recordId, campaignId } });
  return NextResponse.json({ ok: true });
}

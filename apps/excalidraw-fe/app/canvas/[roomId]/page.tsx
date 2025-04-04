import RoomCanvas from "@/components/RoomCanvas";

export default async function RenderCanvas({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  console.log("Rendering canvas for roomId:", roomId); // Debug log

  return (
    <>
      <RoomCanvas roomId={roomId} />
    </>
  );
}
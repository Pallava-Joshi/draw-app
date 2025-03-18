"use client"
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useState } from "react";


export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  // need to implement react hook forms - good practice
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center"}} className={styles.page}>
      <input style={{ padding: 10}} type="text" value={roomId} onChange={(e) => {
        setRoomId(e.target.value)
      }} placeholder="Room ID"/>
      <button style={{ padding:10 }} onClick={() => {
        router.push(`/room/${roomId}`);
      }}>Join Room</button>
    </div>
  );
}

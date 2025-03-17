"use client"
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useState } from "react";


export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  // need to implement react hook forms - good practice
  return (
    <div className={styles.page}>
      <input type="text" value={roomId} onChange={(e) => {
        setRoomId(e.target.value)
      }} placeholder="Room ID"/>
      <button onClick={() => {
        router.push(`/room/${roomId}`);
      }}>Join Room</button>
    </div>
  );
}

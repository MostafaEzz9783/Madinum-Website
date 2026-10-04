"use client";

import { useParams } from "next/navigation";

export default function PublicError({ reset }: { reset: () => void }) {
  const ar = useParams().locale !== "en";
  return <main id="main-content" className="shell empty-state"><h1>{ar ? "تعذر تحميل الصفحة الآن." : "We couldn’t load this page."}</h1><p>{ar ? "حدث خطأ مؤقت. يمكنك إعادة المحاولة بعد لحظات." : "Something went wrong. Please try again in a moment."}</p><button className="button" onClick={reset}>{ar ? "إعادة المحاولة" : "Try again"}</button></main>;
}

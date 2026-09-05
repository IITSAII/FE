/** 프레임에 표시할 날짜를 "YYYY.MM.DD" 형식으로 만든다. */
export function formatFrameDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

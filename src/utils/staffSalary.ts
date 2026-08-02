import { WEEKS_PER_MONTH } from "@/data/balance";

/**
 * staff.salary와 고정비는 월 단위로 저장되고 주 단위로 분할 청구된다.
 * UI는 주 단위 게임 규약(주급 표기)에 맞춰 이 환산값으로 보여준다.
 */
export function getWeeklyStaffSalary(monthlySalary: number): number {
  return Math.round(monthlySalary / WEEKS_PER_MONTH);
}

import dayjs from 'dayjs';

export function formatDate(value: Date, format = 'MMM DD, YYYY') {
  return dayjs(value).format(format);
}

export function daysFromNow(
  value: Date,
  options: { withoutSuffix?: boolean } = { withoutSuffix: false }
) {
  const { withoutSuffix } = options;

  return dayjs(value).fromNow(withoutSuffix);
}

export function addToDate(value: Date, amount: number, unit: dayjs.ManipulateType) {
  return dayjs(value).add(amount, unit);
}

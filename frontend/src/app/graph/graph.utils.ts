import { EventNode } from '../data.service';

const minuteLength = 60;
const hourLength = 60 * minuteLength;
const dayLength = 24 * hourLength;

export const setDuration = (edge: any): void => {
  const sourceTime = new Date(edge.source().data().timestamp);

  const targetTime = new Date(edge.target().data().timestamp);

  let seconds = Math.floor(targetTime.getTime() - sourceTime.getTime());

  const days = Math.floor(seconds / dayLength);

  seconds -= days * dayLength;

  const hours = Math.floor(seconds / hourLength);

  seconds -= hours * hourLength;

  const minutes = Math.floor(seconds / minuteLength);

  seconds -= minutes * minuteLength;

  let result = '';

  if (days) result += `${days}d `;
  if (hours) result += `${hours}h `;
  if (minutes) result += `${minutes}m `;
  if (seconds) result += `${seconds}s`;

  edge.data().properties.set('duration', result);
};

export const setAverageDuration = (edge: any): void => {
  let seconds = Math.floor(edge.data().averageDuration);

  const days = Math.floor(seconds / dayLength);

  seconds -= days * dayLength;

  const hours = Math.floor(seconds / hourLength);

  seconds -= hours * hourLength;

  const minutes = Math.floor(seconds / minuteLength);

  seconds -= minutes * minuteLength;

  let result = '';

  if (days) result += `${days}d `;
  if (hours) result += `${hours}h `;
  if (minutes) result += `${minutes}m `;
  if (seconds) result += `${seconds}s`;

  edge.data().avg = result;
};

export const labelPosition = {
  halign: 'left',
  valign: 'bottom',
  halignBox: 'left',
  valignBox: 'bottom',
};

export const getLabelHtml = (content: string, top: string): string => {
  if (!content) return '';

  return `<div class="bg-blue-300 absolute ${top} px-1 min-w-max h-2 leading-loose lel">
${content}
            </div>`;
};

export const getProperties = (data: EventNode): string => {
  if (!data.properties?.size) return '';

  let value = '';
  data.properties.forEach((property, key) => {
    if (key !== 'duration') value += `${key} => ${property} <br />`;
  });

  return value;
};

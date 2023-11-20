export const nodeStyles = [
  {
    selector: '.Event, .Class',
    style: {
      'text-halign': 'center',
      'text-valign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': '1000px',

      shape: 'round-rectangle',
      'font-size': '10px',
      'border-radius': '3px',
      'background-color': '#B2FF66',
      'overlay-color': 'red',
      'z-index': '100',
    },
  },
  {
    selector: '.Event',
    style: {
      label: (element: any) => {
        return `${element.data().activity}\n${element.data().date}`;
      },
      width: (element: any) => {
        return `${element.data().activity.length * 5.8 + 10}px`;
      },
    },
  },
  {
    selector: '.Placeholder',
    style: {
      'text-halign': 'center',
      'text-valign': 'center',
      label: '...',
    },
  },
  {
    selector: '.Class',
    style: {
      label: (element: any) => {
        return `${element.data().classId}(${element.data().count})`;
      },
      width: (element: any) => {
        return `${element.data().classId.length * 5.8 + 10}px`;
      },
    },
  },
  {
    selector: '.ObjectClass',
    style: {
      label: (element: any) => {
        return `${element.data().type}: ${element.data().amount}`;
      },
    },
  },
  {
    selector: '.ObjectClass',
    style: {
      label: 'data(type)',
      'text-halign': 'center',
      'text-valign': 'center',
    },
  },
];

export const relationshipStyles = [
  {
    selector: '.DirectlyFollows, .DirectlyFollowsClass, .StartsWith, .EndFor',
    style: {
      targetArrowShape: 'triangle',
      'curve-style': 'bezier',
      'text-valign': 'top',
    },
  },
  {
    selector: '.DirectlyFollows',
    style: {
      label: 'data(objectId)',
    },
  },
  {
    selector: '.DirectlyFollowsClass',
    style: {
      label: 'data(count)',
    },
  },
];

export const colors = [
  '#ffd700',
  '#78cff2',
  '#eca3cb',
  '#b2ff66',
  '#f2bba0',
  '#3e8a72',
];

// export const multistyles = [
//   {
//     selector: 'node',
//     style: {
//       'text-halign': 'center',
//       'text-valign': 'center',
//     },
//   },
//   {
//     selector: 'edge',
//     style: {
//       'curve-style': 'bezier',
//       'line-color': (element: any) => {
//         const type = element.data().type;
//         const color = colors[this.objectClasses.get(type)![0]];
//         return color;
//       },
//     },
//   },
//   {
//     selector: '.df',
//     style: {
//       label: 'data(count)',
//     },
//   },
//   {
//     selector: '.activity',
//     style: {
//       label: 'data(name)',
//       shape: 'rectangle',
//       'font-size': '8px',
//       width: (element: any) => {
//         return `${element.data().name.length * 5}px`;
//       },
//       'background-color': '#a7c512',
//     },
//   },
//   {
//     selector: '.start',
//     style: {
//       label: (element: any) => {
//         return `${element.data().type}: ${element.data().amount}`;
//       },
//       'background-color': (element: any) => {
//         const type = element.data().type;
//         const color = colors[this.objectClasses.get(type)![0]];

//         return color;
//       },
//     },
//   },
//   {
//     selector: '.end',
//     style: {
//       label: 'data(type)',
//       'background-color': (element: any) => {
//         const type = element.data().type;
//         const color = colors[this.objectClasses.get(type)![0]];

//         return color;
//       },
//     },
//   },
// ];

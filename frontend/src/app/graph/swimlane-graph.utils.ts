export const graphLayout = {
  elk: {
    name: 'elk',
    rankDir: 'LR',
    ranker: 'tight-tree',
    elk: {
      algorithm: 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '200',
    },
  },
  dagre: {
    name: 'dagre',
    rankDir: 'LR',
    ranker: 'tight-tree',
    elk: {
      algorithm: 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '200',
    },
  },
};

export const setSwimlaneLayout = ({
  graph,
  objects,
  swimlaneType,
  swimlaneHeight,
  colorsMap,
  padding,
  widthMultiplayer,
}: {
  swimlaneHeight: number;
  padding: number;
  widthMultiplayer: number;
  graph: any;
  objects: [string, string, boolean][];
  swimlaneType: string;
  colorsMap: Map<string, string>;
}): any[] => {
  const swimlaneObjects = objects
    .filter((obj) => obj[1] === swimlaneType)
    .map((obj) => obj[0]);

  const removedEdges: any[] = [];

  swimlaneObjects.forEach((obj, key) => {
    const swimlaneEdges = graph.edges(`[objectId='${obj}']`);
    const lineEdge = graph.edges('[type="line"]');

    const swimlaneNodes = swimlaneEdges.connectedNodes();

    const singleInstanceStarts = swimlaneNodes.predecessors().roots();

    let prevX = 0;

    singleInstanceStarts.forEach((startNode: any, index: number) => {
      const singleSwimlaneNodes = startNode
        .successors()
        .intersection(swimlaneNodes);

      removedEdges.push(swimlaneEdges.remove());

      const correlated = singleSwimlaneNodes
        .successors()
        .union(singleSwimlaneNodes.predecessors())
        .difference(singleSwimlaneNodes);

      const swimlaneWidth =
        Math.max(singleSwimlaneNodes.length, correlated.length) *
        widthMultiplayer;

      singleSwimlaneNodes
        .layout({
          name: 'grid',
          fit: true,
          boundingBox: {
            x1: prevX + padding,
            y1: key * swimlaneHeight + swimlaneHeight / 2,
            w: swimlaneWidth - padding,
            h: swimlaneHeight / 2,
          },
        })
        .run();

      singleSwimlaneNodes.lock();

      correlated
        .layout({
          ...graphLayout.elk,
          name: 'dagre',
          boundingBox: {
            x1: prevX + padding,
            y1: key * swimlaneHeight,
            w: swimlaneWidth - padding,
            h: swimlaneHeight / 2,
          },
        })
        .run();

      prevX += swimlaneWidth;

      singleSwimlaneNodes.unlock();
    });

    const node = graph.add({
      group: 'nodes',
      classes: [swimlaneType, 'swimlane'],
      position: { x: 5000, y: (key + 0.75) * swimlaneHeight },
    });

    node.style({
      'background-color': colorsMap.get(swimlaneType),
      opacity: 0.2,
      shape: 'rectangle',
      width: '10080px',
      height: `${swimlaneHeight / 2.8}px`,
      'z-index': '1',
      label: obj,
      'text-valign': 'center',
      'text-halign': 'left',
    });

    node.lock();
    node.ungrabify();
  });

  return removedEdges;
};

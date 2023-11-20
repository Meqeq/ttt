import { DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
  inject,
} from '@angular/core';

interface Node {
  x: number;
  y: number;
  width: number;
  node: any;
  id: string;
  timestamp: number;
  xNew: number;

  depth: number;
  level: number;
}

interface Edge {
  xFrom: number;
  yFrom: number;
  xTo: number;
  yTo: number;
  edge: any;
  color: string;
}

const xOffset = 300;
const yOffset = 120;
const hour = 60 * 60;

@Component({
  selector: 'app-timesheet-canvas',
  templateUrl: './timesheet-canvas.component.html',
  providers: [DatePipe],
})
export class TimesheetCanvasComponent {
  @Input() graph: any;

  @Input() colorsMap!: Map<string, string>;

  @Input() mode: 'single' | 'multi' = 'single';

  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;

  roots: any[] = [];

  nodes: Node[] = [];

  nodesMap = new Map<string, Node>();

  edges: Edge[] = [];

  minTimestamp = Number.MAX_SAFE_INTEGER;

  maxTimestamp = 0;

  timestampSpan = 0;

  xScale = 0;

  transform = '';

  frame = 0;

  canvas = {
    viewBox: { x: 0, y: 0, minX: 0, minY: 0, rightMargin: 0 },
    lines: [] as { x: number; timestamp: number }[],
    timescaleFormat: { single: 'H:mm', multi: 'H' },

    origin: [0, 0],
    drag: false,
    dragOrigin: [0, 0],
    scale: 100,
  };

  width = 0;
  height = 0;

  context!: CanvasRenderingContext2D | null;

  private changeDetectorRef = inject(ChangeDetectorRef);

  private datePipe = inject(DatePipe);

  ngAfterViewInit(): void {
    this.context = this.canvasRef.nativeElement.getContext('2d');

    this.width = this.canvasRef.nativeElement.clientWidth;
    this.height = this.canvasRef.nativeElement.clientHeight;

    this.canvasRef.nativeElement.addEventListener('wheel', this.onWheel);

    this.canvasRef.nativeElement.addEventListener(
      'mousedown',
      this.onMouseDown
    );

    this.canvasRef.nativeElement.addEventListener('mouseup', this.onMouseUp);

    this.canvasRef.nativeElement.addEventListener('mousemove', this.onDrag);

    this.changeDetectorRef.detectChanges();

    requestAnimationFrame(this.update);
    //
  }

  update = (): void => {
    if (!this.context) return;

    this.context.resetTransform();

    this.context.clearRect(
      0,
      0,
      this.canvasRef.nativeElement.width,
      this.canvasRef.nativeElement.height
    );

    this.context.beginPath();

    this.context.translate(-this.canvas.origin[0], 0);

    this.drawLines();

    this.context.translate(0, -this.canvas.origin[1]);

    this.context.strokeText(`${this.frame}`, 0, 20);

    this.context.strokeText(
      `${this.canvas.origin[0]} ${this.canvas.origin[1]}`,
      0,
      60
    );

    this.context.strokeText(`${this.canvas.scale}`, 0, 90);

    this.context.closePath();

    this.drawEdges();

    this.drawActivities();

    this.context.resetTransform();

    this.context.translate(-this.canvas.origin[0], 0);

    this.drawTimeScale();

    this.frame++;

    requestAnimationFrame(this.update);
  };

  drawLines(): void {
    if (!this.context) return;

    this.context.beginPath();

    this.context.strokeStyle = '#ff00004f';

    this.canvas.lines.forEach((line) => {
      this.context?.moveTo(line.x, 0);
      this.context?.lineTo(line.x, this.height);
    });

    this.context?.stroke();

    this.context.closePath();
  }

  drawTimeScale(): void {
    this.context?.beginPath();

    if (this.context) this.context.fillStyle = 'white';

    this.context?.fillRect(
      this.canvas.lines[0]?.x,
      0,
      this.canvas.lines[this.canvas.lines.length - 1]?.x + 200,
      30
    );

    if (this.context) this.context.fillStyle = 'black';
    this.canvas.lines.forEach((line) => {
      this.context?.fillText(
        this.mode === 'single'
          ? this.datePipe.transform(
              line.timestamp * 1000,
              this.canvas.timescaleFormat[this.mode]
            ) || ''
          : `${Math.floor(line.timestamp / 3600)}h`,
        line.x,
        22
      );
    });

    this.context?.closePath();
  }

  drawActivities(): void {
    if (!this.context) return;

    this.context.beginPath();

    this.context.fillStyle = '#B2FF66';
    this.context.strokeStyle = 'black';
    this.context.lineWidth = 1;

    this.nodes.forEach((node) => {
      this.context?.rect(node.xNew, node.y, node.width, 30);
    });

    this.context?.fill();

    this.context.closePath();

    this.context.fillStyle = 'black';
    this.context.font = 'normal 20px serif';

    this.nodes.forEach((node) => {
      this.context?.fillText(
        node.node.data(this.mode === 'single' ? 'activity' : 'name'),
        node.xNew + 2,
        node.y + 20
      );
    });
  }

  drawEdges(): void {
    if (!this.context) return;
    this.context.strokeStyle = 'black';

    this.edges.forEach((edge) => {
      this.context?.beginPath();
      if (this.context) {
        this.context.strokeStyle = edge.color;
        this.context.lineWidth = 3;
      }
      this.context?.moveTo(edge.xFrom, edge.yFrom);
      this.context?.lineTo(edge.xTo, edge.yTo);
      this.context?.stroke();
      this.context?.closePath();
    });
  }

  onWheel = (event: WheelEvent): void => {
    this.canvas.scale *= event.deltaY > 0 ? 1.1 : 0.9;
    this.setTimeScale();
  };

  onMouseDown = (event: MouseEvent): void => {
    this.canvas.drag = true;
    this.canvas.dragOrigin[0] = event.clientX + this.canvas.origin[0];
    this.canvas.dragOrigin[1] = event.clientY + this.canvas.origin[1];
  };

  onMouseUp = (): void => {
    this.canvas.drag = false;
  };

  onDrag = (event: MouseEvent): void => {
    if (!this.canvas.drag) return;

    this.canvas.origin[0] = this.canvas.dragOrigin[0] - event.clientX;
    this.canvas.origin[1] = this.canvas.dragOrigin[1] - event.clientY;
  };

  setTimeScale(): void {
    let step = hour;
    this.canvas.timescaleFormat = {
      single: 'H:mm',
      multi: 'H',
    };

    if (this.canvas.scale < 50) {
      step *= 4;
      this.canvas.timescaleFormat = {
        single: 'H:mm',
        multi: 'H',
      };
    }

    if (this.canvas.scale < 10) {
      step *= 6;
      this.canvas.timescaleFormat = {
        single: 'MMM d',
        multi: 'H',
      };
    }

    this.canvas.lines = [];

    for (
      let lineStamp = this.minTimestamp - (this.minTimestamp % step);
      lineStamp < this.maxTimestamp + step;
      lineStamp += step
    ) {
      this.canvas.lines.push({
        x: ((lineStamp - this.minTimestamp) / hour) * this.canvas.scale,
        timestamp: lineStamp,
      });
    }

    this.nodes.forEach((node, key, nodes) => {
      nodes[key].xNew =
        ((node.timestamp - this.minTimestamp) / hour) * this.canvas.scale;
    });

    this.setEdges();
  }

  ngOnInit(): void {
    this.roots = this.graph.nodes().roots();

    if (this.mode === 'multi') {
      this.graph.nodes().not('.Class').remove();
      this.roots = this.graph.nodes().roots();

      this.roots.forEach((root) => root.data('timestamp', 0));
    }

    this.roots.forEach((root: any, index: number) =>
      this.visitNode(root, 0, index * 5)
    );

    this.timestampSpan = this.maxTimestamp - this.minTimestamp;
    this.xScale = this.timestampSpan / 1000;

    this.canvas.viewBox = {
      x: (this.timestampSpan * 1.1) / this.xScale,
      y: 900,
      minX: (this.timestampSpan * -0.05) / this.xScale,
      minY: -50,
      rightMargin: 50,
    };

    this.calcXPos();
    this.setEdges();
    this.setTimeScale();
  }

  calcXPos(): void {
    this.nodes.forEach((node, index, nodes) => {
      nodes[index].xNew = (node.timestamp - this.minTimestamp) / this.xScale;
    });
  }

  setEdges(): void {
    this.edges = [];
    this.graph.edges().forEach((edge: any) => {
      const sourceNode = this.nodesMap.get(edge.data().source);
      const targetNode = this.nodesMap.get(edge.data().target);

      if (!sourceNode || !targetNode) return;

      const xDiff = targetNode.xNew - (sourceNode.xNew + sourceNode.width);

      let levelDiff = sourceNode.level - targetNode.level;

      if (!levelDiff) {
        if (xDiff < 0) {
          if (sourceNode.y === targetNode.y) targetNode.y += 30;
          levelDiff = -1;
        } else {
          if (sourceNode.y < targetNode.y) targetNode.y -= 30;
        }
      }

      const xFrom = levelDiff ? sourceNode.width / 2 : sourceNode.width + 5;

      const yFrom = levelDiff
        ? levelDiff > 0
          ? sourceNode.y - 5
          : sourceNode.y + 35
        : sourceNode.y + 15;

      this.edges.push({
        xFrom: sourceNode.xNew + xFrom,
        yFrom,
        xTo: targetNode.xNew - 5,
        yTo: targetNode.y + 15,
        edge: edge,
        color: this.colorsMap.get(edge.data().type) || '',
      });
    });
  }

  visitNode(node: any, depth: number, index: number, prevWidth = 0): void {
    let width = 0;
    if (!this.nodesMap.has(node.data().id)) {
      if (node.data('timestamp') === undefined) {
        const incoming = node.incomers()[0];
        const ad = incoming.data('averageDuration');
        const prevAd = incoming.source().data('timestamp');

        node.data('timestamp', ad + prevAd);
      }

      const timestamp = node.data().timestamp;

      width =
        node.data(this.mode === 'single' ? 'activity' : 'name').length * 11;

      const newNode = {
        x: depth * xOffset + xOffset,
        y: index * yOffset + yOffset,
        width,
        node: node,
        id: node.data().id,
        timestamp,
        xNew: 0,
        prevWidth,
        depth,
        level: index,
      };

      this.nodes.push(newNode);

      this.nodesMap.set(node.data().id, newNode);

      if (this.maxTimestamp < timestamp) this.maxTimestamp = timestamp;
      if (this.minTimestamp > timestamp) this.minTimestamp = timestamp;
    }

    const outgoingEdges = node
      .outgoers()
      .edges()
      .sort((a: any, b: any) => {
        return a.data().type > b.data().type;
      });

    outgoingEdges.targets().forEach((node: any, key: number) => {
      this.visitNode(node, depth + 1, index + key, width);
    });
  }
}

import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { DataService, EventNode, Node, Relationship } from '../data.service';

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { nodeStyles, relationshipStyles, colors } from './styles';
import elk from 'cytoscape-elk';
import klay from 'cytoscape-klay';
import { setSwimlaneLayout, graphLayout } from './swimlane-graph.utils';
import { Mode } from '../menu/menu.component';
import htmlLabel from 'cytoscape-html-label';
import {
  getLabelHtml,
  getProperties,
  labelPosition,
  setAverageDuration,
  setDuration,
} from './graph.utils';
import { DatePipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { debounceTime, skip } from 'rxjs';

// cnhl(cytoscape);
htmlLabel(cytoscape);
cytoscape.use(dagre);
cytoscape.use(elk);
cytoscape.use(klay);

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  providers: [DatePipe],
})
export class GraphComponent implements AfterViewInit {
  @ViewChild('graphContainer') graphRef!: ElementRef<HTMLElement>;

  readonly Mode = Mode;

  graph = cytoscape({ wheelSensitivity: 0.1 });

  mode: Mode = Mode.Single;

  objects: [string, string, boolean][] = [];

  types: [string, boolean][] = [];

  colorsMap!: Map<string, string>;

  nodes: Node[] = [];

  relationships: Relationship[] = [];

  swimlaneType = '';

  showNodeLabels = false;

  showEdgeLabels = false;

  showDurationLabels = false;

  showTimesheet = false;

  labelSet = false;

  limit!: FormControl<number>;

  filter!: FormGroup<any>;

  filterMax = [0, 0];

  layout: keyof typeof graphLayout = 'dagre';

  timelineMode: 'single' | 'multi' = 'single';

  private formBuilder = inject(NonNullableFormBuilder);

  private dataService = inject(DataService);

  private datePipe = inject(DatePipe);

  ngOnInit(): void {
    this.limit = this.formBuilder.control(1000);

    this.filter = this.formBuilder.group({
      minNode: [0],
      maxNode: [0],
      minEdge: [0],
      maxEdge: [0],
    });

    this.limit.valueChanges.pipe(debounceTime(500)).subscribe((res) => {
      if (res && res > 10) this.setGraph();
    });

    this.filter.valueChanges
      .pipe(debounceTime(500))
      .subscribe(() => this.setGraph());
  }

  ngAfterViewInit(): void {
    this.setGraph();
  }

  onModeChange(): void {
    this.setGraph();
  }

  onObjectChange(index: number): void {
    this.objects[index][2] = !this.objects[index][2];

    this.objects.forEach((obj) => {
      const edges = this.graph.elements(`[objectId = '${obj[0]}']`);

      edges.forEach((edge: any) => {
        edge.style({ display: obj[2] ? 'element' : 'none' });

        const targetNode = edge.target();
        if (!obj[2] && targetNode.incomers().length > 1)
          targetNode.style({ display: 'none' });
        else targetNode.style({ display: 'element' });
      });
    });
  }

  onTypeChange(index: number): void {
    this.types[index][1] = !this.types[index][1];

    this.objects.forEach((value) => {
      if (value[1] === this.types[index][0]) value[2] = this.types[index][1];
    });

    this.types.forEach((type) => {
      const edges = this.graph.elements(`[type = '${type[0]}']`);

      edges.forEach((edge: any) => {
        edge.style({ display: type[1] ? 'element' : 'none' });
      });

      this.graph.nodes().forEach((node: any) => {
        if (!node.connectedEdges(`[type != '${type[0]}']`).length)
          node.style({ display: type[1] ? 'element' : 'none' });
      });
    });
  }

  setGraph(): void {
    this.resetGraph(this.mode !== Mode.Timesheet);

    switch (this.mode) {
      case Mode.Single:
        this.dataService
          .getResultsSingle()
          .subscribe(({ nodes, relationships }) => {
            this.nodes = nodes;
            this.relationships = relationships;

            this.addNodes(nodes);
            this.addRelationships(relationships);

            this.setStyles(this.colorsMap);
            this.setGraphLayout();
            this.setPlaceholderEventHandler();
          });
        break;

      case Mode.Multi:
        this.dataService
          .getResults(this.filter.value)
          .subscribe(({ nodes, relationships, maxNodeCount, maxEdgeCount }) => {
            this.filterMax = [maxNodeCount, maxEdgeCount];

            if (!this.filter.value.maxEdge)
              this.filter.patchValue(
                {
                  maxEdge: maxEdgeCount,
                  maxNode: maxNodeCount,
                },
                { emitEvent: false }
              );

            this.addNodes(nodes);
            this.addRelationships(relationships);

            this.setStyles(this.colorsMap);
            this.setGraphLayout();
          });
        break;

      case Mode.Swimlane:
        if (this.swimlaneType)
          this.dataService
            .getResultsSingle()
            .subscribe(({ nodes, relationships }) => {
              this.addNodes(nodes);
              this.addRelationships(relationships);

              this.setStyles(this.colorsMap);
              this.setGraphLayout();
            });
        break;

      case Mode.Timesheet:
        console.log(this.timelineMode);
        if (this.timelineMode === 'single')
          this.dataService
            .getResultsSingle()
            .subscribe(({ nodes, relationships }) => {
              this.addNodes(nodes);
              this.addRelationships(relationships);

              this.showTimesheet = true;
            });
        else
          this.dataService
            .getResults()
            .subscribe(({ nodes, relationships }) => {
              this.addNodes(nodes);
              this.addRelationships(relationships);

              this.showTimesheet = true;
            });

        break;
    }
  }

  private setPlaceholderEventHandler(): void {
    this.graph.on('dbltap', '.Placeholder', (event: any) => {
      try {
        const placeholder = event.target;

        const position = placeholder.position();

        placeholder.remove();

        const replacementNode = this.nodes.find(
          (node) => node.id === placeholder.data('id')
        );

        if (!replacementNode) return;

        const relationships = this.relationships.filter(
          (relationship) =>
            relationship.source === replacementNode.id ||
            relationship.target === replacementNode.id
        );

        const newNode = this.graph.add({
          group: 'nodes',
          classes: [replacementNode.label],
          data: replacementNode,
        });

        this.addRelationships(relationships, false);

        newNode.lock();

        this.graph.zoomingEnabled(false);

        newNode
          .connectedEdges()
          .connectedNodes('.Placeholder')
          .layout({
            name: 'dagre',
            fit: true,
            boundingBox: {
              x1: position.x + 40,
              y1: position.y + 40,
              w: 200,
              h: 200,
            },
          })
          .run();

        newNode.unlock();
        newNode.position(position);

        this.graph.zoomingEnabled(true);
      } catch (e) {
        console.log(e);
      }
    });
  }

  private resetGraph(mount = true): void {
    this.showTimesheet = false;

    this.graph.destroy();
    this.graph = cytoscape({ wheelSensitivity: 0.1 });
    if (mount) this.graph.mount(this.graphRef.nativeElement);
  }

  private setPropertiesLabels(): void {
    if (this.mode === Mode.Multi) {
      this.graph.htmlLabel([
        {
          ...labelPosition,
          query: '.DirectlyFollowsClass',
          cssClass: 'duration-label',
          tpl(data: any) {
            return getLabelHtml(`Average duration: ${data.avg}`, '!-top-1');
          },
        },
      ]);

      return;
    }

    this.graph.htmlLabel([
      {
        ...labelPosition,
        query: 'node',
        cssClass: 'node-label',
        tpl(data: EventNode) {
          return getLabelHtml(getProperties(data), '!-top-1');
        },
      },
    ]);

    this.graph.htmlLabel([
      {
        ...labelPosition,
        query: 'edge',
        cssClass: 'edge-label',
        tpl(data: EventNode) {
          return getLabelHtml(getProperties(data), 'top-2');
        },
      },
    ]);

    this.graph.htmlLabel([
      {
        ...labelPosition,
        query: 'edge',
        cssClass: 'duration-label',
        tpl(data: EventNode) {
          return getLabelHtml(data.properties.get('duration') ?? '', '-top-6');
        },
      },
    ]);
  }

  private addNodes(nodes: Node[]): void {
    nodes.slice(0, this.limit.value).forEach((node) => {
      if (node.label !== 'ObjectClass')
        this.graph.add({
          group: 'nodes',
          classes: [node.label],
          data: node,
        });
      else {
        this.graph.add({
          group: 'nodes',
          classes: ['Start'],
          data: {
            ...node,
            id: node.id + '_start',
          },
        });

        this.graph.add({
          group: 'nodes',
          classes: ['End'],
          data: {
            ...node,
            id: node.id + '_end',
          },
        });
      }
    });
  }

  private addPlaceholderNode(source: string, target: string): boolean {
    const sourceNodes = this.graph.nodes(`[id = "${source}"]`);
    const targetNodes = this.graph.nodes(`[id = "${target}"]`);

    if (!sourceNodes.length && !targetNodes.length) return true;

    if (!sourceNodes.length) {
      if (targetNodes[0].data('placeholder')) return true;
      this.graph.add({
        group: 'nodes',
        classes: ['Placeholder'],
        data: {
          id: source,
          placeholder: true,
        },
      });
    }

    if (!targetNodes.length) {
      if (sourceNodes[0].data('placeholder')) return true;

      this.graph.add({
        group: 'nodes',
        classes: ['Placeholder'],
        data: {
          id: target,
          placeholder: true,
        },
      });
    }
    return false;
  }

  private addRelationships(relationships: Relationship[], first = true): void {
    const types = new Set<string>();
    const objects = new Map<string, string>();

    relationships.forEach((relationship) => {
      switch (relationship.label) {
        case 'StartsWith':
          this.graph.add({
            group: 'edges',
            classes: [relationship.label],
            data: {
              ...relationship,
              source: relationship.source + '_start',
            },
          });
          break;

        case 'EndFor':
          this.graph.add({
            group: 'edges',
            classes: [relationship.label],
            data: {
              ...relationship,
              target: relationship.target + '_end',
            },
          });
          break;

        default:
          if (this.addPlaceholderNode(relationship.source, relationship.target))
            return;
          this.graph.add({
            group: 'edges',
            classes: [relationship.label],
            data: relationship,
            source: relationship.source,
            target: relationship.target,
          });
      }

      if (
        relationship.label === 'DirectlyFollows' ||
        relationship.label === 'DirectlyFollowsClass'
      )
        types.add(relationship.type);

      if (relationship.label === 'DirectlyFollows')
        objects.set(relationship.objectId, relationship.type);
    });

    if (!first) return;

    this.objects = Array.from(objects).map((val) => [val[0], val[1], true]);

    this.objects = this.objects.sort((a, b) => {
      return a[0].localeCompare(b[0]);
    });

    this.types = Array.from(types).map((val) => [val, true]);

    this.types = this.types.sort((a, b) => {
      return a[0].localeCompare(b[0]);
    });

    this.colorsMap = this.getColorsMap(types);
  }

  private setDurations(): void {
    if (this.mode === Mode.Multi) {
      this.graph.edges('.DirectlyFollowsClass').forEach(setAverageDuration);

      return;
    }

    this.graph.edges().forEach(setDuration);
  }

  private getColorsMap(types: Set<string>): Map<string, string> {
    const colorsMap = new Map<string, string>();

    let index = 0;
    types.forEach((type) => {
      colorsMap.set(type, colors[index++]);
    });

    return colorsMap;
  }

  private setStyles(colorsMap: Map<string, string>): void {
    this.graph.style([
      ...nodeStyles,
      ...relationshipStyles,
      {
        selector:
          '.DirectlyFollows, .DirectlyFollowsClass, .StartsWith, .EndFor',
        style: {
          'line-color': (element: any) => {
            return colorsMap.get(element.data().type);
          },
        },
      },
      {
        selector: '.Start, .End',
        style: {
          label: (element: any) => {
            return `${element.data().type}: ${element.data().amount}`;
          },
          'background-color': (element: any) => {
            // console.log(element.data());
            return colorsMap.get(element.data().type);
          },
        },
      },
    ]);
  }

  onShowNode(): void {
    if (!this.labelSet) {
      this.setPropertiesLabels();
      this.setDurations();
    }
  }

  setGraphLayout(): void {
    switch (this.mode) {
      case Mode.Single:
      case Mode.Multi:
        this.graph.layout(graphLayout[this.layout]).run();
        break;
      case Mode.Swimlane:
        if (this.swimlaneType) {
          setSwimlaneLayout({
            graph: this.graph,
            objects: this.objects,
            colorsMap: this.colorsMap,
            swimlaneType: 'line',
            swimlaneHeight: 300,
            widthMultiplayer: 35,
            padding: 60,
          });
        }
    }
  }
}

import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { DataService } from '../data.service';

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

const colors = ['#e3123a', '#8ae27c', '#972ea1', '#a5ce12', '#7ca5ca'];

const graphLayout = {
  name: 'dagre',
  rankDir: 'LR',
};

@Component({
  selector: 'app-single-graph',
  templateUrl: './single-graph.component.html',
})
export class SingleGraphComponent {
  private dataService = inject(DataService);

  @ViewChild('graph') graphRef!: ElementRef<HTMLElement>;

  graph = cytoscape({ wheelSensitivity: 0.1 });

  objects: [string, boolean][] = [];

  types: [string, boolean][] = [];

  loading = false;

  log = '';

  mode: 'single' | 'multi' = 'single';

  objectClasses = new Map<string, [number, number]>();

  ngOnInit(): void {
    this.setGraph();
  }

  ngAfterViewInit(): void {
    this.graph.mount(this.graphRef.nativeElement);
  }

  changeMode(): void {
    if (this.mode === 'single') this.mode = 'multi';
    else this.mode = 'single';

    this.setGraph();
  }

  onFileInput(e: any): void {
    this.loading = true;

    const [log] = e.target?.files as File[];

    this.dataService.uploadLog(log).subscribe(() => {
      this.loading = false;

      this.log = log.name;

      this.setGraph();
    });
  }

  setGraph(): void {
    if (this.mode === 'single') this.setSingleGraph();
    else this.setMultiGraph();
  }

  setSingleGraph(): void {
    this.dataService
      .getResultsSingle()
      .subscribe(({ nodes, relationships }) => {
        this.graph.remove('*');

        this.setSingleStyle();

        console.log(nodes, relationships);

        const objects = new Set<string>();

        const types = new Set<string>();

        nodes.forEach((node: any) => {
          this.graph.add({
            group: 'nodes',
            classes: ['activity'],
            data: {
              ...node.properties,
              id: node.id,
            },
          });
        });

        relationships.forEach((relationship: any) => {
          objects.add(relationship.properties.objectId);
          types.add(relationship.properties.type);

          this.graph.add({
            group: 'edges',
            classes: ['df', relationship.properties.objectId],
            data: {
              ...relationship,
              ...relationship.properties,
            },
          });
        });

        this.objects = Array.from(objects)
          .map((obj) => [obj, true] as [string, boolean])
          .sort((a, b) => {
            return a[0].localeCompare(b[0]);
          });

        this.types = Array.from(types)
          .map((obj) => [obj, true] as [string, boolean])
          .sort((a, b) => {
            return a[0].localeCompare(b[0]);
          });

        this.graph.layout(graphLayout).run();
      });
  }

  onObjectChange(index: number): void {
    this.objects[index][1] = !this.objects[index][1];

    this.objects.forEach((obj) => {
      const edges = this.graph.elements(`[objectId = '${obj[0]}']`);

      edges.forEach((edge: any) => {
        edge.style({ display: obj[1] ? 'element' : 'none' });

        const targetNode = edge.target();
        if (!obj[1] && targetNode.incomers().length > 1)
          targetNode.style({ display: 'none' });
        else targetNode.style({ display: 'element' });
      });
    });
  }

  onTypeChange(index: number): void {
    this.types[index][1] = !this.types[index][1];

    this.types.forEach((type) => {
      const edges = this.graph.elements(`[type = '${type[0]}']`);

      edges.forEach((edge: any) => {
        edge.style({ display: type[1] ? 'element' : 'none' });

        const targetNode = edge.target();
        if (!type[1] && targetNode.incomers().length > 1)
          targetNode.style({ display: 'none' });
        else targetNode.style({ display: 'element' });
      });
    });
  }

  setMultiGraph(): void {
    this.dataService
      .getResults()
      .subscribe(({ nodes, objectClasses, relationships }) => {
        const graphLayout = {
          name: 'dagre',
          rankDir: 'LR',
        };

        console.log(nodes);

        const types = new Set<string>();

        this.graph.remove('*');

        this.setMultiStyle();

        nodes.forEach((node: any) => {
          if (node.labels[0] === 'Class')
            this.graph.add({
              group: 'nodes',
              classes: ['activity'],
              data: {
                id: node.id,
                ...node.properties,
              },
            });
          else {
            this.graph.add({
              group: 'nodes',
              classes: ['start'],
              data: {
                id: node.id + 'start',
                ...node.properties,
              },
            });
            this.graph.add({
              group: 'nodes',
              classes: ['end'],
              data: {
                id: node.id + 'end',
                ...node.properties,
              },
            });
          }
        });

        relationships.forEach((relationship: any) => {
          switch (relationship.label) {
            case 'DirectlyFollowsClass':
              types.add(relationship.properties.type);

              this.graph.add({
                group: 'edges',
                classes: ['df'],
                data: {
                  ...relationship,
                  ...relationship.properties,
                },
              });
              break;

            case 'StartsWith':
              this.graph.add({
                group: 'edges',
                data: {
                  ...relationship,
                  source: relationship.source + 'start',
                  ...relationship.properties,
                },
              });
              break;

            case 'EndFor':
              this.graph.add({
                group: 'edges',
                data: {
                  ...relationship,
                  target: relationship.target + 'end',
                  ...relationship.properties,
                },
              });
          }
        });

        objectClasses.forEach((type: any, index: number) => {
          this.objectClasses.set(type.type, [index, type.amount]);
        });

        this.types = Array.from(types)
          .map((obj) => [obj, true] as [string, boolean])
          .sort((a, b) => {
            return a[0].localeCompare(b[0]);
          });

        this.graph.layout(graphLayout).run();
      });
  }

  setSingleStyle(): void {
    const singleStyles = [
      {
        selector: 'node',
        style: {
          'text-halign': 'center',
          'text-valign': 'center',
        },
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'line-color': (element: any) => {
            const type = element.data().type;
            console.log(type);
            const color = '#123ae1'; // colors[this.objectClasses.get(type)![0]];
            return color;
          },
        },
      },
      {
        selector: '.df',
        style: {
          label: 'data(objectId)',
          targetArrowShape: 'triangle',
        },
      },
      {
        selector: '.activity',
        style: {
          'text-wrap': 'wrap',
          'text-max-width': '1000px',
          label: (element: any) => {
            return `${element.data().activity}\n${element.data().timestamp}`;
          },
          shape: 'rectangle',
          'font-size': '10px',
          width: (element: any) => {
            return `${element.data().activity.length * 6}px`;
          },
          'background-color': '#a7c512',
        },
      },
      {
        selector: '.start',
        style: {
          label: (element: any) => {
            return `${element.data().type}: ${element.data().amount}`;
          },
          'background-color': (element: any) => {
            const type = element.data().type;
            const color = '#eaea21'; //colors[this.objectClasses.get(type)![0]];

            return color;
          },
        },
      },
      {
        selector: '.end',
        style: {
          label: 'data(type)',
        },
      },
    ];

    this.graph.style(singleStyles);
  }

  setMultiStyle(): void {
    const multiStyles = [
      {
        selector: 'node',
        style: {
          'text-halign': 'center',
          'text-valign': 'center',
        },
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'line-color': (element: any) => {
            const type = element.data().type;
            const color = colors[this.objectClasses.get(type)![0]];
            return color;
          },
        },
      },
      {
        selector: '.df',
        style: {
          label: 'data(count)',
        },
      },
      {
        selector: '.activity',
        style: {
          label: 'data(name)',
          shape: 'rectangle',
          'font-size': '8px',
          width: (element: any) => {
            return `${element.data().name.length * 5}px`;
          },
          'background-color': '#a7c512',
        },
      },
      {
        selector: '.start',
        style: {
          label: (element: any) => {
            return `${element.data().type}: ${element.data().amount}`;
          },
          'background-color': (element: any) => {
            const type = element.data().type;
            const color = colors[this.objectClasses.get(type)![0]];

            return color;
          },
        },
      },
      {
        selector: '.end',
        style: {
          label: 'data(type)',
          'background-color': (element: any) => {
            const type = element.data().type;
            const color = colors[this.objectClasses.get(type)![0]];

            return color;
          },
        },
      },
    ];

    this.graph.style(multiStyles);
  }
}

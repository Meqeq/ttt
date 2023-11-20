import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DatePipe } from '@angular/common';

export interface ClassNode {
  id: string;
  label: 'Class';
  classId: string;
  name: string;
  type: string;
}

export interface ObjectClassNode {
  id: string;
  label: 'ObjectClass';
  amount: string;
  type: string;
}

export interface EventNode {
  id: string;
  label: 'Event';
  eventId: string;
  activity: string;
  timestamp: string;
  date: string;
  properties: Map<string, string>;
}

export interface ObjectNode {
  id: string;
  label: 'Object';
  objectId: string;
  type: string;
  properties: Map<string, string>;
}

export type Node = ClassNode | ObjectClassNode | EventNode | ObjectNode;

export interface BelongsToRelationship {
  id: string;
  source: string;
  target: string;
  label: 'BelongsTo';
}

export interface CorrelatedRelationship {
  id: string;
  source: string;
  target: string;
  label: 'Correlated';
}

export interface DirectlyFollowsRelationship {
  id: string;
  source: string;
  target: string;
  label: 'DirectlyFollows';
  objectId: string;
  type: string;
  duration: string;
}

export interface DirectlyFollowsClassRelationship {
  id: string;
  source: string;
  target: string;
  label: 'DirectlyFollowsClass';
  type: string;
  count: number;
  averageDuration: number;
}

export interface EndForRelationship {
  id: string;
  source: string;
  target: string;
  label: 'EndFor';
  type: string;
}

export interface StartsWithRelationship {
  id: string;
  source: string;
  target: string;
  label: 'StartsWith';
  type: string;
}

export type Relationship =
  | BelongsToRelationship
  | CorrelatedRelationship
  | DirectlyFollowsRelationship
  | DirectlyFollowsClassRelationship
  | EndForRelationship
  | StartsWithRelationship;

export interface Graph {
  nodes: Node[];
  relationships: Relationship[];
}

export interface Filters {
  minNode: number;
  maxNode: number;
  minEdge: number;
  maxEdge: number;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  private datePipe = inject(DatePipe);

  uploadLog(log: File): Observable<void> {
    const formData = new FormData();

    formData.append(log.name, log);

    return this.http.post<void>('http://localhost:5001/log', formData);
  }

  getResults(filters?: Filters): Observable<any & { nodes: Node[] }> {
    console.log(filters, filters?.maxEdge || filters?.maxNode ? filters : {});
    return this.http
      .post<any>(
        'http://localhost:5001/result',
        filters?.maxEdge || filters?.maxNode ? filters : {}
      )
      .pipe(
        map(
          ({
            nodes,
            relationships,
            objectClasses,
            maxEdgeCount,
            maxNodeCount,
          }) => {
            const mappedNodes = nodes.map((node: any) => {
              return {
                ...node,
                label: node.labels[0],
                ...node.properties,
              };
            });

            const mappedRelationships = relationships.map(
              (relationship: any) => {
                return {
                  ...relationship,
                  ...relationship.properties,
                };
              }
            );

            return {
              nodes: mappedNodes,
              relationships: mappedRelationships,
              objectClasses,
              maxEdgeCount,
              maxNodeCount,
            };
          }
        )
      );
  }

  getResultsSingle(): Observable<Graph> {
    return this.http.post<any>('http://localhost:5001/result-single', {}).pipe(
      map(({ nodes, relationships }) => {
        console.log(nodes, relationships);

        const mappedNodes = nodes.map((node: any) => {
          const { id, labels, properties } = node;
          const { activity, eventId, timestamp, date, ...rest } = properties;

          const extraProperties = new Map<string, string>();

          Object.keys(rest).forEach((key) => {
            extraProperties.set(key, rest[key]);
          });

          return {
            id,
            label: labels[0],
            date: this.datePipe.transform(date, 'M/d/yy, H:mm'),
            activity,
            eventId,
            timestamp,
            properties: extraProperties,
          };
        });

        const mappedRelationships = relationships.map((relationship: any) => {
          const { id, label, source, target, properties } = relationship;

          const { objectId, type, ...rest } = properties;

          const extraProperties = new Map<string, string>();

          Object.keys(rest).forEach((key) => {
            extraProperties.set(key, rest[key]);
          });

          return {
            id,
            label,
            source,
            target,
            objectId,
            type,
            properties: extraProperties,
          };
        });

        return {
          nodes: mappedNodes,
          relationships: mappedRelationships,
        };
      })
    );
  }
}

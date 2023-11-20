import ocel
from neo4j import GraphDatabase
import json
from queries import clearDb, getCreateObjectQuery, getCreateEventQuery, getCreateDirectlyFollowsQuery, createEventClasses, createDirectlyFollowsForClasses, getCreateRelationsQuery, createObjectClasses, createEndForRelationships, createStartsWithRelationships


from flask import Flask, request
from flask_cors import CORS

connection = GraphDatabase.driver(
    "bolt://localhost:7687/test",
    auth=("neo4j", "12345678"),
    database="test"
)

app = Flask(__name__)
CORS(app)

@app.post("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.post("/log")
def process_log():
    fileName = next(iter(request.files))
    file = request.files[fileName]

    file.save(f"./logs/{fileName}")

    with connection.session() as session:
        clearDb(session)

        log = ocel.import_log(f"./logs/{fileName}")

        objects = ocel.get_objects(log)

        for id in objects:
            query = getCreateObjectQuery(id, objects[id])
            print(query)
            session.run(query)

        events = ocel.get_events(log)

        for id in events:
            print(events[id])
            query = getCreateEventQuery(id, events[id])
            print(query)
            session.run(query)

            for objectId in events[id]['ocel:omap']:
                query = getCreateRelationsQuery(id, objectId)
                print(query)
                session.run(query)

        session.run(getCreateDirectlyFollowsQuery())

        createEventClasses(session)

        createDirectlyFollowsForClasses(session)

        createObjectClasses(session)

        createEndForRelationships(session)

        createStartsWithRelationships(session)
    return ('', 204)

@app.post("/result")
def get_result():
    data = request.get_json()

    with connection.session() as session:
        query = """
        MATCH (c1:Class) WHERE c1.type = "Activity"
        OPTIONAL MATCH (c1) - [ef:EndFor] -> (oc1)
        OPTIONAL MATCH (oc2) - [sw: StartsWith] -> (c1)
        OPTIONAL MATCH (c1)-[df:DirectlyFollowsClass]->(c2) WHERE c1.type = c2.type
        OPTIONAL MATCH (c1)-[sync:Sync]->(c3) WHERE c1.type = c3.type
        RETURN c1,df,c2,sync,c3, oc1, ef, sw , oc2
        """

        if 'maxEdge' in data and 'maxNode' in data:
            query = """
        MATCH (c1:Class) WHERE c1.type = "Activity" AND c1.count <= {} AND c1.count >= {}
        OPTIONAL MATCH (c1) - [ef:EndFor] -> (oc1)
        OPTIONAL MATCH (oc2) - [sw: StartsWith] -> (c1)
        OPTIONAL MATCH (c1)-[df:DirectlyFollowsClass]->(c2)
            WHERE c1.type = c2.type AND df.count <= {} AND df.count >= {}
            AND c2.count <= {} AND c2.count >= {}
        OPTIONAL MATCH (c1)-[sync:Sync]->(c3) WHERE c1.type = c3.type
        RETURN c1,df,c2,sync,c3, oc1, ef, sw , oc2
        """.format(data['maxNode'], data['minNode'], data['maxEdge'], data['minEdge'], data['maxNode'], data['minNode'])

        result = session.run(query)

        graph = result.graph()
        
        nodes = []
    
        relationships = []

        objectClasses = []

        for node in graph.nodes:
            nodes.append({
                "id": node.element_id,
                "labels": list(node.labels),
                "properties": node._properties
            })

        for relationship in graph.relationships:
            relationships.append({
                "id": relationship.element_id,
                "label": relationship.type,
                "properties": relationship._properties,
                "source": relationship.start_node.element_id,
                "target": relationship.end_node.element_id
            })

        result2 = session.run("""
        MATCH (n:ObjectClass) RETURN n
        """)

        graph2 = result2.graph()
        
        for objectClass in graph2.nodes:
            objectClasses.append(objectClass._properties)

        print(json.dumps(objectClasses))
                

        print("=================")

        result3 = session.run("""MATCH ()-[r:DirectlyFollowsClass]-() RETURN max(r.count) AS count""")

        result4 = session.run("""MATCH (c: Class) RETURN max(c.count) AS count""")

        return {
            "relationships": relationships,
            "nodes": nodes,
            "objectClasses": objectClasses,
            "maxEdgeCount": result3.single()['count'],
            "maxNodeCount": result4.single()['count'],
        }

@app.post("/result-single")
def get_result_single():
    with connection.session() as session:
        result = session.run("""
        MATCH (n:Event) WITH n ORDER BY n.timestamp  LIMIT 1000 OPTIONAL MATCH (n)-[r:DirectlyFollows]-(e: Event) RETURN n, r, e;
        """)

        graph = result.graph()
        nodes = []
        relationships = []

        for node in graph.nodes:
            nodes.append({
                "id": node.element_id,
                "labels": list(node.labels),
                "properties": node._properties
            })

        for relationship in graph.relationships:
            relationships.append({
                "id": relationship.element_id,
                "label": relationship.type,
                "properties": relationship._properties,
                "source": relationship.start_node.element_id,
                "target": relationship.end_node.element_id
            })

        return {
            "relationships": relationships,
            "nodes": nodes,
        }




connection.close()

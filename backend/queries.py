import time
import datetime

def clearDb(session):
    session.run("MATCH (n) DETACH DELETE n")

def getCreateEventQuery(id, ocelEvent):
    query = "MERGE (e: Event {"
    query += f"eventId:'{id}', activity:'{ocelEvent['ocel:activity']}'"
    query += f", date:'{ocelEvent['ocel:timestamp']}'"
    query += f", timestamp:{ocelEvent['ocel:timestamp'].timestamp()}"

    if 'ocel:vmap' in ocelEvent:
        for key in ocelEvent['ocel:vmap']:
            query += f", `{key}`:'{ocelEvent['ocel:vmap'][key]}'"

    query += "})"

    return query

def getCreateObjectQuery(id, ocelObject):
    query = "MERGE (o: Object {"
    query += f"objectId:'{id}', type:'{ocelObject['ocel:type']}'"

    if 'ocel:ovmap' in ocelObject:
        for key in ocelObject['ocel:ovmap']:
            query += f", `{key}`:'{ocelObject['ocel:ovmap'][key]}'"

    query += "})"

    return query

def getCreateRelationsQuery(eventId, objectId):
    query = f"MATCH (e: Event {{eventId: '{eventId}'}}) "
    query += f"MATCH (o: Object {{objectId: '{objectId}'}}) "

    query += "MERGE (e)-[:Correlated]-(o)"
    
    return query

def getCreateDirectlyFollowsQuery():
    return """
    MATCH (o:Object)
    MATCH (o)<-[:Correlated]-(e)
    WITH o, e ORDER BY e.timestamp
    WITH o, collect(e) AS eventsList
    UNWIND range(0, size(eventsList) - 2) AS i
    WITH o, eventsList[i] AS e1, eventsList[i+1] AS e2
    CREATE (e1)-[df:DirectlyFollows {
        type:o.type, objectId:o.objectId,
        duration: e2.timestamp - e1.timestamp
    }]->(e2)
    SET df += properties(o)
    """

def createEventClasses(session):
    session.run("""
    MATCH ( e : Event ) WITH distinct e.activity AS activityName, count(e) as eventCount
    MERGE ( c : Class {
        name: activityName,
        type:"Activity",
        classId: activityName,
        count: eventCount
    })
    """)
    session.run("""
    MATCH ( c : Class ) WHERE c.type = "Activity"
    MATCH ( e : Event ) WHERE c.name = e.activity
    CREATE ( e ) -[:BelongsTo]-> ( c )
    """)

def createDirectlyFollowsForClasses(session):
    session.run(
        """
    MATCH ( c1 : Class )
        <-[:BelongsTo]- ( e1 : Event )
        -[df:DirectlyFollows]-> ( e2 : Event )
        -[:BelongsTo]-> ( c2 : Class)
    MATCH (e1) -[:Correlated] -> (n) <-[:Correlated]- (e2)
    WHERE c1.type = c2.type AND n.type = df.type
    WITH n.type as EType,c1,count(df) AS df_freq,c2, avg(df.duration) as averageDuration
    MERGE ( c1 ) -[rel2:DirectlyFollowsClass {type:EType}]->
        ( c2 ) ON CREATE SET rel2 += { count: df_freq, averageDuration: averageDuration }
        """
    )


def createEventClasses2(session):
    session.run(
        """
        MATCH (e:Event)-[:Correlated]->(o:Object)
            WITH distinct e.activity as activityName,o.type as objectType
        MERGE (c:Class {
            eventClassId: activityName + "_" + objectType,
            activityName: activityName,
            objectType: objectType,
            type:"Activity,Type"
        })
        """
    )

    session.run(
        """
        MATCH (c: Class) WHERE c.type = "Activity,Type"
        MATCH (e: Event)-[:Correlated]->(o:Object)
            WHERE c.activityName = e.activity AND c.objectType = o.type
        CREATE (e) -[:BelongsTo]-> (c)
        """
    )

def createDirectlyFollowsForClasses2(session):
    session.run(
        """
        MATCH (c1: Class)
            <-[:BelongsTo]-
            (e1: Event)
            -[df:DirectlyFollows]->
            (e2: Event)
            -[:BelongsTo]->
            (c2: Class)
        MATCH (e1) -[:Correlated] -> (o) <-[:Correlated]- (e2)
        WHERE c1.type = c2.type
        AND o.type = df.type
        AND c1.objectType = o.type
        AND c2.objectType = o.type
        WITH o.type as objectType, c1, count(df) AS frequency, c2
        MERGE ( c1 )
           -[rel2:DirectlyFollowsClass {
              objectType: objectType
           }]->
           (c2)
        ON CREATE SET rel2 += { count: frequency, averageDuration: avg(df.duration) }
        """
    )

    session.run(
        """
        MATCH (c1: Class),
            (c2: Class)
        WHERE c1.activityName = c2.activityName
        AND c1.objectType <> c2.objectType
        MERGE (c1)-[:Sync]->(c2)
        """
    )

    """MATCH (c1:Class) WHERE c1.type = "Activity,Type"
OPTIONAL MATCH (c1)-[df:DirectlyFollowsClass]->(c2) WHERE c1.type = c2.type
OPTIONAL MATCH (c1)-[sync:Sync]->(c3) WHERE c1.type = c3.type
RETURN c1,df,c2,sync,c3"""

def createObjectClasses(session):
    session.run(
        """
        MATCH (o: Object)
        WITH distinct o.type as objectType, count(o) as amount
        MERGE (oc: ObjectClass { type: objectType, amount: amount })
        """
    )

def createEndForRelationships(session):
    session.run(
        """
        MATCH (c1: Class) - [df: DirectlyFollowsClass] -> (c2: Class) WHERE NOT (c2) - [:DirectlyFollowsClass {type: df.type}] -> () 
        MATCH (oc: ObjectClass { type: df.type})
        MERGE (c2) - [:EndFor {type: df.type}] -> (oc)
        """
    )

def createStartsWithRelationships(session):
    session.run(
        """
        MATCH (c1: Class) - [df: DirectlyFollowsClass] -> (c2: Class) WHERE NOT () - [:DirectlyFollowsClass {type: df.type}] -> (c1) 
        MATCH (oc: ObjectClass { type: df.type})
        MERGE (oc) - [:StartsWith {type: df.type}] -> (c1)
        """
    )

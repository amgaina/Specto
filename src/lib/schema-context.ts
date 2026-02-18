export const SCHEMA_CONTEXT = `
You are querying a PostgreSQL database with a single table called "AvianMonitoring".

This table stores bird colony monitoring data collected from field surveys, camera observations, and dotting records.

==============================
TABLE: AvianMonitoring
==============================

Each row represents one monitoring record for a specific colony, species, and observation date.

---------------------------------
IDENTIFIERS
---------------------------------
id: Unique internal record ID.
uid: External dataset unique ID.
createdAt: Timestamp when the record was inserted.

---------------------------------
DATE INFORMATION
---------------------------------
year: Observation year.
date: Full observation date.
dateDotted: Date birds were dotted (tagged).
date2, month, day: Alternate date string fields (may be redundant).

---------------------------------
COLONY INFORMATION
---------------------------------
colonyID: Internal colony identifier.
colonyName: Name of the bird colony.
subcolony: Subdivision of colony.
state: US state of the colony.

latitude_x, longitude_x: Primary GPS coordinates.
latitude_y, longitude_y: Secondary GPS coordinates (may represent adjusted values).

primaryHabitat: Main habitat type.
landForm: Geographic land formation.
geoRegion: Broad geographic region.
terrestEcoRegion: Terrestrial ecological region.
marineEcoRegion: Marine ecological region.
extrapArea: Extrapolated area classification.
colonyGroupBuffer: Buffer grouping classification.
formerNames: Historical colony names.
activeInventory: Indicates if colony is active in inventory.

---------------------------------
SPECIES INFORMATION
---------------------------------
speciesCode: Species identifier code.
pq: Quality or classification code.
bestForBPE: Indicates if record is best for Breeding Population Estimate.

---------------------------------
FIELD COLLECTION INFORMATION
---------------------------------
dotter: Person who dotted/tagged birds.
origDotterID: Original dotter identifier.
dottingAreaNumber: Dotting area reference.
dottersColonyNumber: Colony number used by dotter.

cameraNumber: Camera ID used in survey.
cardNumber: Memory card number.
photoNumber: Photo identifier.

---------------------------------
NEST & BIRD COUNTS
---------------------------------

TOTALS:
total_nests: Total nests observed.
total_birds: Total birds observed.

NEST TYPES:
wbn: With bird nesting.
pbn: Probable bird nesting.
chickNest: Chick nest count.
chickNestwithoutAdult: Chick nests without adult present.
abandNest: Abandoned nests.
emptyNest: Empty nests.

BROOD & TERRITORY:
brood: Brood count.
territory: Territory count.
site: Site count.

CHICKS:
chicksNestlings: Nestlings count.
chicksNestlingsAlt: Alternate nestlings column.

ROOSTING:
roostingBirds: Total roosting birds.
roostingAdults: Roosting adults.
roostingImmatures: Roosting immature birds.
unknownAge: Birds of unknown age.

OTHER:
otherAdultsInColony: Additional adults present.
otherImmInColony: Additional immature birds.
otherBirds: Other bird counts.

---------------------------------
NOTES & MEDIA
---------------------------------
notes: General field notes.
additionalNotes: Additional comments.
notesAugust2022: Specific notes from August 2022 dataset.

highResImage_new: High resolution image URL/path.
screenshot_new: Screenshot reference.
thumbnail_new: Thumbnail image path.

---------------------------------
IMPORTANT QUERY RULES
---------------------------------

1. Aggregations:
   - Use SUM() for numeric bird counts.
   - Use COUNT() for number of records.
   - Use AVG() for averages.
   - Group by year, speciesCode, colonyName when needed.

2. Time Filtering:
   - Use year for yearly analysis.
   - Use date for precise date filtering.

3. Location Filtering:
   - Use colonyName or state.
   - Use latitude_x and longitude_x for mapping.

4. Bird Population Insights:
   - total_birds and total_nests are primary metrics.
   - chicksNestlings + brood indicate reproduction success.
   - abandNest + emptyNest indicate nesting failure.

Always generate valid PostgreSQL SQL queries when answering analytical questions.
`;

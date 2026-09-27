# NOAA Ocean Observation — Provenance

## Source dataset
- **Program:** NOAA CalCOFI hydrographic survey (Southwest Fisheries Science Center),
  CTD cast data served as `erdCalCOFINOAAhydros`
- **Exact source URL (retrieved 2026):**
  `https://oceanview.pfeg.noaa.gov/erddap/tabledap/erdCalCOFINOAAhydros`
- **Cast bundled here:** cruise `201407`, line `76.1`, station `51.9`,
  observed `2014-08-23T02:40:00Z` at `35.096664°N, 121.05333°E`
  (R/V Bell M. Shimada), 14 depth levels from 3 m to 400 m
- **Variables:** `time, latitude, longitude, line, station, cruise, ship,`
  `ctd_depth (m), temperature (°C), salinity (PSU), oxygen (ml/l)`

## Relationship to the World Ocean Database (WOD)
- Authoritative WOD references:
  - Product: <https://www.ncei.noaa.gov/products/world-ocean-database>
  - Reader docs: <https://www.ncei.noaa.gov/access/world-ocean-database/read-wod.html>
  - Retrieval: <https://www.ncei.noaa.gov/access/world-ocean-database-select/dbsearch.html>
- Direct WODselect extraction requires an email-gated custom retrieval, and the
  WOD ERDDAP mirrors were unreachable from the build environment, so the bundled
  cast was obtained from NOAA's operational ERDDAP instead.
- CalCOFI hydrographic CTD observations are contributed to and archived in the
  NCEI World Ocean Database; this file is therefore genuine NOAA CTD profile
  data of exactly the WOD-CTD kind (temperature / salinity / oxygen vs depth),
  with full cruise/station/ship lineage above.

## Local file
- `wod-calcofi-ctd.csv` — the retrieved cast, stored verbatim (ERDDAP CSV
  output, header + units rows preserved). Small representative subset only;
  the full database is never bundled or downloaded at runtime.

## Processing notes
- Parsed at build time by `src/services/noaaWodService.ts` (no runtime fetch,
  no CORS dependency, cached in memory).
- Pressure is derived from depth (1 dbar ≈ 1 m of seawater), a standard
  oceanographic approximation, and is labelled as derived wherever shown.
- Oxygen units are millilitres per litre (ml/l) as reported by the source.
- These are real ocean observations from NOAA. They are NOT measurements from
  the user's physical prototype.

import { ClubMarker } from "./ClubMarker";
import { OldClubMarker } from "./OldClubMarker";

import { Assemble } from "./Assemble";
import { Outernet } from "./Outernet";
import { HQ } from "./HQ";
import { Steve } from "./Steve";
import { levenshtein } from "underscore.string";

import { Epoch } from "./Epoch";
import { ZephyrStop } from "./ZephyrStop";
import { ZephyrStart } from "./ZephyrStart";
import { UserLocationDot } from "./UserLocationDot";
import ZephyrPath from "./ZephyrPath";
import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import leaflet from "leaflet";
import { Badge } from "theme-ui";

import { useRouter } from "next/router";

function MapEvents() {
  const map = useMapEvents({
    dblclick() {
      window.open("https://directory.hackclub.com/MapPage", "_blank");
    },
  });
}

function Map({
  clubs,
  userLongitude,
  userLatitude,
  search,
  selectedContinent,
  fullScreen,
  searchContent,
  setSelectedClubs,
  selectedClubs,
  recentlyCopied,
  setRecentlyCopied,
  eventsShown,
  setEventsShown,
}) {
  const router = useRouter();
  const [embed, setEmbed] = useState("embed" in router.query);

  useEffect(() => {
    setEmbed("embed" in router.query);
  }, [router.query]);

  function filterOldResults(club) {
    return (
      fullScreen ||
      ((selectedContinent == "" || selectedContinent == club?.continent) &&
        (club.name?.toLowerCase().includes(searchContent.toLowerCase()) ||
          club.name
            ?.toLowerCase()
            .split(" ")
            .some((word) =>
              searchContent
                .split(" ")
                ?.some(
                  (searchTerm) =>
                    levenshtein(word.toLowerCase(), searchTerm.toLowerCase()) <
                    2
                )
            ) ||
          club?.country?.toLowerCase().includes(searchContent.toLowerCase()) ||
          club?.country_code
            ?.toLowerCase()
            .includes(searchContent.toLowerCase()) ||
          club?.state?.toLowerCase().includes(searchContent.toLowerCase()) ||
          club?.venue?.toLowerCase().includes(searchContent.toLowerCase()) ||
          club?.location?.toLowerCase().includes(searchContent.toLowerCase()) ||
          club?.postcode?.toLowerCase().includes(searchContent.toLowerCase()) ||
          club?.leaders?.some((leader) =>
            leader.name?.toLowerCase().includes(searchContent.toLowerCase())
          )))
    );
  }
  const mapRef = useRef(null);

  const ZephyrPos = [
    [44, -73], // Burlington, VT (44.4765° N, 73.2123° W)
    [40, -74], // New York City, NY (40.7128° N, 74.0060° W)
    [41, -87], // Chicago, IL (41.8781° N, 87.6298° W)
    [39, -105], // Denver, CO (39.7392° N, 104.9903° W)
    [37, -122], // San Francisco, CA (37.7749° N, 122.4194° W)
    [34, -118], // Los Angeles, CA (34.0522° N, 118.2437° W)
  ];
  const [legacyClubsVisible, setLegacyClubsVisible] = useState(true);

  const [oldClubs, setOldClubs] = useState([]);
  useEffect(() => {
    // Ensuring Leaflet's CSS is applied only on the client side.
    import("leaflet/dist/leaflet.css");
    //Gets the clubs from the ArpanAPI™
    fetch("https://clubs-directory.herokuapp.com/clubs/old")
      .then((response) => response.json())
      .then((data) => {
        const dataFormatted = data.filter(
          (anOldClub) =>
            anOldClub?.coordinates?.latitude !== undefined &&
            anOldClub?.coordinates?.longitude !== undefined &&
            anOldClub?.name !== null &&
            !clubs.some(
              (newClub) =>
                newClub?.geo_data?.coordinates?.latitude ==
                  anOldClub?.coordinates?.latitude &&
                newClub?.geo_data?.coordinates?.longitude ==
                  anOldClub?.coordinates?.longitude
            )
        );
        setOldClubs(dataFormatted);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    flyToSearchOnChange(map);
  }, [clubs, oldClubs]);

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        ref={mapRef}
        style={{ width: "100%", height: fullScreen ? "100vh" : "600px" }}
        center={[45, 0]}
        zoom={3}
        minZoom={2} // Set the maximum zoom level
        zoomControl={embed ? false : true}
        boundsOptions={{ padding: [50, 50] }}
        whenCreated={(map) => {
          map.fitBounds([
            [90, -180], // Top-left corner
            [-90, 180], // Bottom-right corner
          ]);
        }}
        maxBounds={[
          [90, -180], // Top-left corner
          [-90, 180], // Bottom-right corner
        ]}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        />
        {embed === true && <MapEvents />}
        {Array.isArray(clubs) &&
          clubs.map((club) => (
            <ClubMarker
              club={club}
              leaflet={leaflet}
              clubs={clubs}
              encodeURIComponent={encodeURIComponent}
              location={location}
              navigator={navigator}
              setRecentlyCopied={setRecentlyCopied}
              recentlyCopied={recentlyCopied}
              selectedClubs={selectedClubs}
              setSelectedClubs={setSelectedClubs}
            />
          ))}
        {Array.isArray(oldClubs) &&
          legacyClubsVisible &&
          oldClubs
            .filter((club) => filterOldResults(club, selectedContinent))
            .map((oldClub) => (
              <OldClubMarker
                oldClub={oldClub}
                leaflet={leaflet}
                clubs={clubs}
                encodeURIComponent={encodeURIComponent}
                location={location}
                navigator={navigator}
                setRecentlyCopied={setRecentlyCopied}
                recentlyCopied={recentlyCopied}
                selectedClubs={selectedClubs}
                setSelectedClubs={setSelectedClubs}
              />
            ))}
        {eventsShown ? (
          <>
            <Assemble leaflet={leaflet} />
            <Outernet leaflet={leaflet} />
            <Steve leaflet={leaflet} />
            <HQ leaflet={leaflet} />

            <Epoch leaflet={leaflet} />
            <ZephyrStart pos={ZephyrPos} leaflet={leaflet} />

            <ZephyrStop pos={ZephyrPos} leaflet={leaflet} />
            <ZephyrPath pos={ZephyrPos} />
          </>
        ) : null}
        {userLongitude !== null && userLatitude !== null && (
          <UserLocationDot
            userLatitude={userLatitude}
            userLongitude={userLongitude}
          />
        )}
      </MapContainer>
      {embed === false && (
        <>
          <Badge
            variant={eventsShown ? "pill" : "outline"}
            sx={{
              position: "absolute",
              bottom: 56,
              left: 2,
              zIndex: 701,
              fontSize: "1.25rem",
              cursor: "pointer",
            }}
            color={!eventsShown ? "muted" : null}
            onClick={() => setEventsShown(!eventsShown)}
          >
            {eventsShown ? "Hide" : "Show"} Events
          </Badge>
          <Badge
            variant={legacyClubsVisible ? "pill" : "outline"}
            sx={{
              position: "absolute",
              bottom: 2,
              left: 2,
              zIndex: 701,
              fontSize: "1.25rem",
              cursor: "pointer",
            }}
            color={!legacyClubsVisible ? "muted" : null}
            onClick={() => setLegacyClubsVisible(!legacyClubsVisible)}
          >
            {legacyClubsVisible ? "Hide Non-directory" : "Show All"} Clubs
          </Badge>
        </>
      )}
    </div>
  );

  function flyToSearchOnChange(map) {
    if (map && clubs.length > 0 && search != "") {
      const { latitude, longitude } = clubs[0].geo_data.coordinates;
      map.flyTo([latitude, longitude], 10);
    }
  }
}

export default Map;

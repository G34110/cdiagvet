import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MY_CLIENTS_QUERY = gql`
  query MyClients {
    myClients {
      id
      name
      city
      latitude
      longitude
    }
  }
`;

export default function MapPage() {
  const { data, loading } = useQuery(MY_CLIENTS_QUERY);

  const clients = data?.myClients?.filter(
    (c: { latitude?: number; longitude?: number }) => c.latitude && c.longitude
  ) || [];

  const defaultCenter: [number, number] = [46.603354, 1.888334]; // Centre de la France

  return (
    <div className="map-page">
      <header className="page-header">
        <h1>Carte des clients</h1>
      </header>

      {loading && <div className="loading">Chargement...</div>}

      <div className="map-container">
        <MapContainer
          center={defaultCenter}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {clients.map((client: { id: string; name: string; city?: string; latitude: number; longitude: number }) => (
            <Marker key={client.id} position={[client.latitude, client.longitude]}>
              <Popup>
                <strong>{client.name}</strong>
                {client.city && <><br />{client.city}</>}
                <br />
                <Link to={`/clients/${client.id}`} style={{ color: 'var(--primary)' }}>
                  Voir la fiche
                </Link>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

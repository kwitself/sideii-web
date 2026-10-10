import GlobalHeader from '../components/GlobalHeader';
import OrderTrackingClient from '../components/OrderTrackingClient';
import './track.css';
export const metadata={title:'Track Order',description:'Track a SIDE:II order.'};
export default function TrackOrderPage(){return <main><GlobalHeader/><OrderTrackingClient/></main>}

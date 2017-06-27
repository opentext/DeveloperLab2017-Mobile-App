import React from 'react';
import {Page, Button, BottomToolbar, List, ListItem, ListHeader, Icon, Input} from 'react-onsenui';
import withScriptjs from 'react-google-maps/lib/async/withScriptjs';
import {withGoogleMap, GoogleMap, Marker} from "react-google-maps";
import {AWLocation, AWCompass} from 'appworks-js';
import * as _ from 'lodash';
import {Subject} from 'rxjs';

/**
 * Wrapper around the "react-google-maps" rendering helper to wrap our Google Map component and provide it with
 * defaults and input/output bindings.
 */
const DeveloperLabGMap = _.flowRight(withScriptjs, withGoogleMap)(props => (
    <GoogleMap
        ref={props.onMapLoad}
        defaultZoom={15}
        center={getMapCenter(props)}
        onDragStart={props.onDragStart}
        onClick={props.onMapClick}>
        {props.markers.map(marker => (
            <Marker
                {...marker}
                onRightClick={() => props.onMarkerRightClick(marker)}
            />
        ))}
    </GoogleMap>
));

const getMapCenter = (props => {
    if (props.setDefaultMapCenter) {
        return {lat: 43.6525, lng: -79.381667};
    } else if (!props.ignoreCenterChange) {
        return props.center;
    } else {
        return null;
    }
});

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {username: ''};
    }

    // constructor(props) {
    //     super(props);
    //     this.state = {
    //         markers: [],
    //         currentLocation: null,
    //         setDefaultMapCenter: true
    //     };
    //     this.handleMapLoad = this.handleMapLoad.bind(this);
    //     this.handleMapClick = this.handleMapClick.bind(this);
    //     this.handleMarkerRightClick = this.handleMarkerRightClick.bind(this);
    //     this.handleDragStart = this.handleDragStart.bind(this);
    //
    //     this.location$ = new Subject();
    //     this.startTrackingLocation();
    //
    //     document.addEventListener('deviceready', () => {
    //         const location = new AWLocation(position => {
    //             this.location$.next(position);
    //         });
    //         location.watchPosition({enableHighAccuracy: true, filter: 10});
    //     });
    // }
    //
    // startTrackingLocation() {
    //     this.location$.subscribe(position => {
    //
    //     });
    // }
    //
    // handleDragStart() {
    //     this.setState({
    //         setDefaultMapCenter: false,
    //         ignoreCenterChange: true
    //     });
    // }
    //
    // handleMapLoad(map) {
    // }
    //
    // handleMapClick(event) {
    // }
    //
    // handleMarkerRightClick(targetMarker) {
    // }

    renderToolbar() {
        return (
            <BottomToolbar>
                <div style={{textAlign: 'center', padding: '0.6rem'}}>Developer Lab 2017</div>
            </BottomToolbar>
        );
    }

    render() {
        return (
            <Page renderToolbar={this.renderToolbar} contentStyle={{top: 0, bottom: 0}}>
                <section style={{textAlign: 'center'}}>
                    <p style={{textAlign: 'center'}}>
                        <Input placeholder="Search for tweets"/>
                    </p>
                    <p>
                        <Button modifier="outline">Search</Button>
                    </p>
                </section>
            </Page>
        );
    }

    // render() {
    //     return (
    //         <Page renderToolbar={this.renderToolbar} contentStyle={{top: 0, bottom: 0}}>
    //             <DeveloperLabGMap
    //                 googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyBq5UXyM3tZ-cbQ8S_-RB7VwdoYZOmaAHg"
    //                 loadingElement={<div style={{height: '75%', textAlign: 'center', paddingTop: '50%'}}><Icon icon='ion-navigate' /></div>}
    //                 containerElement={<div style={{ height: `75%`}} />}
    //                 mapElement={<div style={{ height: `100%` }} />}
    //                 markers={this.state.markers}
    //                 center={this.state.center ? {lat: this.state.center.lat, lng: this.state.center.lng} : undefined}
    //                 setDefaultMapCenter={this.state.setDefaultMapCenter}
    //                 ignoreCenterChange={this.state.ignoreCenterChange}
    //                 onMapLoad={this.handleMapLoad}
    //                 onMapClick={this.handleMapClick}
    //                 onDragStart={this.handleDragStart}
    //                 onMarkerRightClick={this.handleMarkerRightClick}/>
    //             <List renderHeader={() => {
    //                 return (
    //                     <ListHeader>
    //                         <Icon icon="ion-ios-circle-filled"
    //                               style={{color: 'limegreen', position: 'relative', top: '-2px', padding: '0 0.25rem'}}/>
    //                         Live
    //                     </ListHeader>
    //                 );
    //             }}>
    //                 <ListItem tappable={true} onClick={() => {
    //
    //                 }}>
    //                     <Icon icon="ion-navigate" style={{padding: '0 0.25rem'}}/>
    //                     My Location
    //                 </ListItem>
    //             </List>
    //         </Page>
    //     );
    // }
}
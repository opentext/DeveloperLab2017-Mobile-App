import React from 'react';
import {Page, Button, BottomToolbar, List, ListItem, ListHeader, Icon} from 'react-onsenui';
import withScriptjs from 'react-google-maps/lib/async/withScriptjs';
import {withGoogleMap, GoogleMap, Marker} from "react-google-maps";
import {AWLocation, AWCompass} from 'appworks-js';
import * as _ from 'lodash';

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
        this.state = {markers: [], locations: [], setDefaultMapCenter: true};
        this.handleMapLoad = this.handleMapLoad.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);
        this.handleMarkerRightClick = this.handleMarkerRightClick.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);

        document.addEventListener('deviceready', () => {
            this.startTrackingLocation();
        });
    }

    startTrackingLocation() {
        const location = new AWLocation(position => {
            this.setState({
                markers: [{position: {lat: position.coords.latitude, lng: position.coords.longitude}}],
                locations: [{lat: position.coords.latitude, lng: position.coords.longitude}]
            });
            // console.info('Position change:', position);
        });
        location.watchPosition({enableHighAccuracy: true, filter: 10});

        const compass = new AWCompass(heading => {
            this.setState({
                locations: [Object.assign({}, {heading: heading}, this.state.locations[0] || {})]
            });
            // console.info('Heading change:', heading);
        });
        compass.watchHeading({enableHighAccuracy: true, timeout: 100});
    }

    handleDragStart() {
        this.setState({
            setDefaultMapCenter: false,
            ignoreCenterChange: true
        });
    }

    handleMapLoad(map) {
    }

    handleMapClick(event) {
    }

    handleMarkerRightClick(targetMarker) {
    }

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
                <DeveloperLabGMap
                    googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyBq5UXyM3tZ-cbQ8S_-RB7VwdoYZOmaAHg"
                    loadingElement={<div style={{height: '75%', textAlign: 'center', paddingTop: '50%'}}><Icon icon='ion-navigate' /></div>}
                    containerElement={<div style={{ height: `75%`}} />}
                    mapElement={<div style={{ height: `100%` }} />}
                    markers={this.state.markers}
                    center={this.state.center ? {lat: this.state.center.lat, lng: this.state.center.lng} : undefined}
                    setDefaultMapCenter={this.state.setDefaultMapCenter}
                    ignoreCenterChange={this.state.ignoreCenterChange}
                    onMapLoad={this.handleMapLoad}
                    onMapClick={this.handleMapClick}
                    onDragStart={this.handleDragStart}
                    onMarkerRightClick={this.handleMarkerRightClick}/>
                <List
                    style={{height: '25%'}}
                    dataSource={this.state.locations}
                    renderHeader={() => <ListHeader>Live Location Update</ListHeader>}
                    renderRow={(row, index) => (
                        <ListItem key={index} modifier="nodivider" tappable={true} onClick={() => {
                            this.setState({
                                ignoreCenterChange: false,
                                setDefaultMapCenter: false,
                                center: this.state.locations[0] ? {lat: this.state.locations[0].lat, lng: this.state.locations[0].lng} : null
                            })
                        }}>
                            <Icon icon='ion-navigate' />
                            <span style={{padding: '0 0.5rem'}}>
                                {row.lat.toString().slice(0, 10)},
                                &nbsp;
                                {row.lng.toString().slice(0, 10)}
                            </span>
                            <Icon icon='ion-compass' />
                            <span style={{padding: '0 0.5rem'}}>
                                {row.heading ? row.heading.magneticHeading.toString().slice(0, 5) : null}
                            </span>
                        </ListItem>
                    )}
                />
            </Page>
        );
    }
}
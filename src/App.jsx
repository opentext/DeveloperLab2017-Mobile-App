import React from 'react';
import {Page, Button, BottomToolbar, List, ListItem, ListHeader, Icon, Input, ProgressBar} from 'react-onsenui';
import withScriptjs from 'react-google-maps/lib/async/withScriptjs';
import {withGoogleMap, GoogleMap, Marker} from "react-google-maps";
import {AWLocation, AWCompass} from 'appworks-js';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import 'whatwg-fetch'

/**
 * Default coordinates point to Toronto
 * @type {{lat: number, lng: number}}
 */
const defaultMapCenter = {lat: 43.6525, lng: -79.381667};

/**
 * The service that provides us with our twitter search data
 * @type {string}
 */
const tweetServiceEndpoint = 'http://ew2016.appworks.dev:8080/twitter-proxy-service/api/tweets?searchTerm=Wayne+Gretzky';

/**
 * Wrapper around the "react-google-maps" rendering helper to wrap our Google Map component and provide it with
 * defaults and input/output bindings.
 */
const DeveloperLabGMap = _.flowRight(withScriptjs, withGoogleMap)(props => (
    <GoogleMap
        ref={props.onMapLoad}
        defaultZoom={10}
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

/**
 * helper function provides us with coordinates for the center of our map
 * @type {(p1:*)}
 */
const getMapCenter = (props => {
    if (props.setDefaultMapCenter) {
        return defaultMapCenter;
    } else if (!props.ignoreCenterChange) {
        return props.center;
    } else {
        return null;
    }
});

/**
 * The React component responsible for rendering our UI
 */
export default class App extends React.Component {

    constructor(props) {
        super(props);
        // the state includes markers for the map, the current pin location, and the current tweet text
        this.state = {
            markers: [],
            currentLocation: null,
            setDefaultMapCenter: true,
            currentTweet: {
                fromUser: null,
                text: 'Loading...'
            },
            tweets: [],
            tweetBatchSize: 0
        };
        // handle input bindings correctly
        this.handleMapLoad = this.handleMapLoad.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);
        this.handleMarkerRightClick = this.handleMarkerRightClick.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);

        // observable stream for location updates will add markers and re-center the map
        this.location$ = new Subject();
        // get the users location to display an initial marker
        this.addLocationChangeHandler();
        // subscribe to location$ changes on the stream and update the UI with a new marker and re-center the map
        this.startTracking();
        // start polling for twitter data after a timeout so we can see the user's initial location
        this.pollForTweets();
    }

    /**
     * Ask for the user's initial location once, and broadcast this value into the location$ stream. This will end up
     * updating the ui with a new marker and map center.
     */
    addLocationChangeHandler() {
        document.addEventListener('deviceready', () => {
            const location = new AWLocation(position => {
                this.location$.next(position);
            });
            location.getCurrentPosition({enableHighAccuracy: true, filter: 10});
        });
    }

    /**
     * Implement the subscribe block for the location$ stream. This will update the UI with new markers and a new
     * map center by calling the React hook setState() with new data. React will automatically call render() in order
     * to update the view with new data.
     */
    startTracking() {
        this.location$.subscribe(position => {
            if (position) {
                this.setState({
                    setDefaultMapCenter: false,
                    ignoreCenterChange: false,
                    markers: this.state.markers.concat([{
                        position: {lat: position.coords.latitude, lng: position.coords.longitude},
                        key: position.timestamp,
                    }]),
                    center: {lat: position.coords.latitude, lng: position.coords.longitude}
                });
            } else {
                this.setState({
                    setDefaultMapCenter: true,
                    markers: [{position: defaultMapCenter, key: new Date().getTime()}]
                });
            }
        });
    }

    /**
     * Ask the twitter service for random twitter data (with locations) and poll every n seconds
     */
    pollForTweets(n=10000) {
        const headers = new Headers({'Content-Type': 'application/json'});
        const request = new Request(tweetServiceEndpoint, {
            method: 'GET',
            headers: headers,
        });
        fetch(request).then(res => {
            return res.json();
        }).then(tweets => {
            const doEmitNextTweet = () => {
                if (tweets.length) {
                    const currentTweet = tweets.pop();
                    this.setState({currentTweet: currentTweet.tweet, tweets: tweets});
                    this.location$.next({
                        coords: {latitude: currentTweet.latLng.lat, longitude: currentTweet.latLng.lng},
                        timestamp: new Date().getTime()
                    });
                    setTimeout(() => {
                        doEmitNextTweet();
                    }, n);
                } else {
                    this.pollForTweets();
                }
            };
            // update the batch size to show the progress bar correctly
            this.setState({tweetBatchSize: tweets.length});
            // tweets come in batches of 0-50 -- emit one at a time and then grab the next batch
            doEmitNextTweet();
        });
    }

    /**
     * Implement the handler for map drag events
     */
    handleDragStart() {
        this.setState({
            setDefaultMapCenter: false,
            ignoreCenterChange: true
        });
    }

    /**
     * Implement a lifecycle event when the map is done loading
     * @param map
     */
    handleMapLoad(map) {
    }

    /**
     * Implement the handler for standard clicks on the map
     * @param event
     */
    handleMapClick(event) {
    }

    /**
     * Implement the handler for right clicks on a marker on the map
     * @param targetMarker
     */
    handleMarkerRightClick(targetMarker) {
    }

    /**
     *
     * @returns {XML}
     */
    render() {
        return (
            <Page contentStyle={{top: 0, bottom: 0}}>
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
                <ProgressBar indeterminate={this.state.tweets.length === 0}
                             value={((this.state.tweetBatchSize - (this.state.tweets.length || this.state.tweetBatchSize)) / this.state.tweetBatchSize) * 100} />
                <h3 style={{letterSpacing: '-2px', margin: '0.5rem'}}>
                    <Icon style={{position: 'relative', top: '-4px'}} icon="ion-social-twitter-outline"/>
                    <span style={{padding: '0.5rem'}}>{`@${this.state.currentTweet.fromUser}`}</span>
                </h3>
                <p style={{margin: '0.5rem'}}>{this.state.currentTweet.text}</p>
            </Page>
        );
    }
}
/**
 * Default coordinates point to Toronto
 * @type {{lat: number, lng: number}}
 */
import React from 'react';
import {
    Page,
    AlertDialog,
    SpeedDial,
    SpeedDialItem,
    Fab,
    Button,
    BottomToolbar,
    List,
    ListItem,
    ListHeader,
    Icon,
    Input,
    ProgressBar
} from 'react-onsenui';
import withScriptjs from 'react-google-maps/lib/async/withScriptjs';
import {withGoogleMap, GoogleMap, Marker} from "react-google-maps";
import {AWLocation, AWCompass, AWFileSystem, isDesktopEnv, isMobileEnv} from 'appworks-js';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import 'whatwg-fetch'

const defaultZoomLevel = 10;

const defaultMapCenter = {lat: 43.6525, lng: -79.381667};

/**
 * The service that provides us with our twitter search data
 * @type {string}
 */
const tweetServiceEndpoint = 'http://ew2016.appworks.dev:8080/twitter-proxy-service/api/tweets';

/**
 * Wrapper around the "react-google-maps" rendering helper to wrap our Google Map component and provide it with
 * defaults and input/output bindings.
 */
const DeveloperLabGMap = _.flowRight(withScriptjs, withGoogleMap)(props => (
    <GoogleMap
        ref={props.onMapLoad}
        defaultZoom={props.zoomLevel}
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
            zoomLevel: defaultZoomLevel,
            currentTweet: {
                fromUser: null,
                text: 'Loading...'
            },
            batch: [],
            tweets: [],
            batchSize: 0,
            showToast: false
        };
        this.rotationTimeout = null;
        this.pollTimeout = null;
        // handle input bindings correctly
        this.handleMapLoad = this.handleMapLoad.bind(this);
        this.handleMapClick = this.handleMapClick.bind(this);
        this.handleMarkerRightClick = this.handleMarkerRightClick.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);

        // observable stream for location updates will add markers and re-center the map
        this.location$ = new Subject();
        // set the following in a timeout to smooth the ui updates
        setTimeout(() => {
            // get the users location to display an initial marker
            this.addLocationChangeHandler();
            // subscribe to location$ changes on the stream and update the UI with a new marker and re-center the map
            this.startTracking();
            // start polling for twitter data after a timeout so we can see the user's initial location
            this.pollForTweets();
        });
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
    pollForTweets() {
        const headers = new Headers({'Content-Type': 'application/json'});
        const request = new Request(tweetServiceEndpoint, {
            method: 'GET',
            headers: headers,
        });
        fetch(request).then(res => {
            return res.json();
        }).then(tweets => {
            this.tweetsDidLoad(tweets);
            this.setState({zoomLevel: defaultZoomLevel});
        });
    }

    /**
     * Emit tweets on a timeout. When all tweets in the list have been emitted, fetch the next batch and repeat.
     * @param tweets
     * @param nextTweetTimeout
     * @param nextBatchTimeout
     */
    tweetsDidLoad(tweets, nextTweetTimeout = 10000, nextBatchTimeout = 0) {
        const doEmitNextTweet = () => {
            if (tweets.length) {
                const currentTweet = tweets.pop();
                this.setState({currentTweet: currentTweet.tweet, tweets: tweets});
                this.location$.next({
                    coords: {latitude: currentTweet.latLng.lat, longitude: currentTweet.latLng.lng},
                    timestamp: new Date().getTime()
                });
                this.rotationTimeout = setTimeout(() => {
                    doEmitNextTweet();
                }, nextTweetTimeout);
            } else {
                this.pollTimeout = setTimeout(() => {
                    this.pollForTweets();
                }, nextBatchTimeout);
            }
        };
        // reset timeouts
        clearTimeout(this.rotationTimeout);
        clearTimeout(this.pollTimeout);
        // update the batch size to show the progress bar correctly
        this.setState({batchSize: tweets.length, batch: Object.assign([], tweets)});
        // tweets come in batches of 0-50 -- emit one at a time and then grab the next batch
        doEmitNextTweet();
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
     */
    exportTweets() {
        const fileManager = new AWFileSystem();
        fileManager.getPath('documents', path => {
            fileManager.createFile(
                `${path}/EW2017TwitterData.json`,
                () => this.setState({showToast: true}),
                err => console.error(err),
                JSON.stringify(this.state.batch)
            );
        });
    }

    /**
     *
     */
    importTweets() {
        const fileManager = new AWFileSystem();
        fileManager.showFileSelector({multiSelections: false}, result => {
            const path = result[0];
            fileManager.readFile(path, data => {
                try {
                    const tweets = JSON.parse(data);
                    this.tweetsDidLoad(tweets, 10, 50000);
                    this.setState({zoomLevel: 50});
                } catch (e) {
                    console.error(e);
                }
            });
        });
    }

    /**
     *
     * @returns {number}
     */
    progressBarValue() {
        return ((this.state.batchSize - (this.state.tweets.length || this.state.batchSize)) / this.state.batchSize) * 100;
    }

    /**
     *
     * @returns {*}
     */
    renderToolbar() {
        if (isDesktopEnv()) {
            return (
                <div>
                    <SpeedDial position="bottom right">
                        <Fab>
                            <Icon icon="md-more"/>
                        </Fab>
                        <SpeedDialItem onClick={() => this.exportTweets()}>
                            <Icon icon="md-download"/>
                        </SpeedDialItem>
                        <SpeedDialItem onClick={() => this.importTweets()}>
                            <Icon icon="md-file-text"/>
                        </SpeedDialItem>
                    </SpeedDial>
                    <AlertDialog isOpen={this.state.showToast} modifier="material">
                        <div className="alert-dialog-title">Success</div>
                        <div className="alert-dialog-content">{this.state.batch.length} Tweets exported</div>
                        <div className="alert-dialog-footer">
                            <button className="alert-dialog-button" onClick={() => this.setState({showToast: false})}>
                                Done
                            </button>
                        </div>
                    </AlertDialog>
                </div>
            );
        } else {
            return null;
        }
    }

    /**
     *
     * @returns {XML}
     */
    render() {
        return (
            <Page renderToolbar={() => this.renderToolbar()} contentStyle={{top: 0, bottom: 0}}>
                <DeveloperLabGMap
                    googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyBq5UXyM3tZ-cbQ8S_-RB7VwdoYZOmaAHg"
                    loadingElement={(
                        <div style={{height: '75%', textAlign: 'center', paddingTop: '50%'}}>
                            <Icon icon='ion-navigate'/>
                        </div>)}
                    containerElement={<div style={{height: `75%`}}/>}
                    mapElement={<div style={{height: `100%`}}/>}
                    zoomLevel={this.state.zoomLevel}
                    markers={this.state.markers}
                    center={this.state.center ? {lat: this.state.center.lat, lng: this.state.center.lng} : undefined}
                    setDefaultMapCenter={this.state.setDefaultMapCenter}
                    ignoreCenterChange={this.state.ignoreCenterChange}
                    onMapLoad={this.handleMapLoad}
                    onMapClick={this.handleMapClick}
                    onDragStart={this.handleDragStart}
                    onMarkerRightClick={this.handleMarkerRightClick}/>
                <ProgressBar indeterminate={this.state.tweets.length === 0} value={this.progressBarValue()}/>
                <h3 style={{letterSpacing: '-2px', margin: '0.5rem'}}>
                    <Icon style={{position: 'relative', top: '-2px'}} icon="ion-social-twitter-outline"/>
                    <span style={{padding: '0.5rem'}}>{`@${this.state.currentTweet.fromUser}`}</span>
                </h3>
                <p style={{margin: '0.5rem'}}>{this.state.currentTweet.text}</p>
            </Page>
        );
    }
}
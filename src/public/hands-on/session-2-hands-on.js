const pendingItems = new Rx.Subject();

pendingItems.subscribe(item => {
    api.syncLocation(item).then(result => {
        console.log('Location sent successfully!');
    }).catch(error => {
        console.error('Uh oh! There was an error.', error);
        // add item back to stream to retry
        pendingItems.next(item);
    });
});

// location change handler bound to syncLocation()
function syncLocation(event) {
    pendingItems.next({
        latitude: event.coords.latitude,
        longitude: event.coords.longitude
    });
}

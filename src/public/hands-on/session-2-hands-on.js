const pendingItems = new Rx.Subject();
// TODO

pendingItems.subscribe(item => {
    api.syncLocation(item).then(result => {
        // TODO
    }).catch(error => {
        // TODO
    });
});

// location change handler bound to syncLocation()
function syncLocation(event) {
    pendingItems.next({
        latitude: event.coords.latitude,
        longitude: event.coords.longitude
    });
}

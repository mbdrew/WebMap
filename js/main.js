require(["application/bootstrapmap",
         "esri/layers/ArcGISDynamicMapServiceLayer",
         "esri/layers/ArcGISTiledMapServiceLayer",
         "esri/geometry/Extent",
         "esri/SpatialReference",
         "esri/dijit/BasemapLayer",
         "esri/dijit/Basemap",
         "esri/dijit/BasemapGallery",
         "agsjs/dijit/TOC",
         "dojo/domReady!"], 
  function(BootstrapMap, 
    ArcGISDynamicMapServiceLayer, 
    ArcGISTiledMapServiceLayer, 
    Extent, 
    SpatialReference, 
    BasemapLayer, 
    Basemap, 
    BasemapGallery,
    TOC)
    {

      // Get a reference to the ArcGIS Map class
      var initExtent = new Extent({ "xmin": 1170000, "ymin": 90000, "xmax": 1263200, "ymax": 181350, "spatialReference": { "wkid": 3433 } });
      var map = BootstrapMap.create("mapDiv",{

        //center:[1200000,140000],
        //zoom:12,
        //scrollWheelZoom: false
        extent: initExtent});

      dynLayer = new ArcGISDynamicMapServiceLayer("http://maps.lrwu.com/wa/rest/services/MoreLayers/MapServer");
      tiledLayer = new ArcGISDynamicMapServiceLayer("http://www.pagis.org/ArcGIS/rest/services/MAPS/BaseMap/MapServer");



            // Code for displaying TOC
      map.on('layers-add-result', function (evt) {
        // overwrite the default visibility of service.
        // TOC will honor the overwritten value.
        dynLayer.setVisibleLayers([0,1]);
        toc = new TOC({
          map: map,
          layerInfos: [{
            layer: dynLayer,
            title: "Layers"
            //collapsed: false, // whether this root layer should be collapsed initially, default false.
            //slider: false // whether to display a transparency slider.
          }]
        }, 'tocDiv');
        toc.startup();
        toc.on('load', function () {
          if (console)
            console.log('TOC loaded');
        });
      });

      console.log("next line is map.addLayer");
      map.addLayers([tiledLayer, dynLayer]);

    });
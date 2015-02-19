require(["application/bootstrapmap",
         "esri/layers/ArcGISDynamicMapServiceLayer",
         "esri/layers/ArcGISTiledMapServiceLayer",
         "esri/geometry/Extent",
         "esri/SpatialReference",
         "esri/dijit/BasemapLayer",
         "esri/dijit/Basemap",
         "esri/dijit/BasemapGallery",
         "dojo/domReady!"], 
  function(BootstrapMap, 
          ArcGISDynamicMapServiceLayer, 
          ArcGISTiledMapServiceLayer, 
          Extent, 
          SpatialReference, 
          BasemapLayer, 
          Basemap, 
          BasemapGallery) {

    // Get a reference to the ArcGIS Map class
    var initExtent = new Extent({ "xmin": 1170000, "ymin": 90000, "xmax": 1263200, "ymax": 181350, "spatialReference": { "wkid": 3433 } });
    var map = BootstrapMap.create("mapDiv",{

      //center:[1200000,140000],
      //zoom:12,
      //scrollWheelZoom: false
      extent: initExtent});

    dynLayer = new ArcGISDynamicMapServiceLayer("http://maps.lrwu.com/wa/rest/services/MoreLayers/MapServer");
    tiledLayer = new ArcGISDynamicMapServiceLayer("http://www.pagis.org/ArcGIS/rest/services/MAPS/BaseMap/MapServer");

    console.log("next line is map.addLayer");
    map.addLayers([tiledLayer, dynLayer]);
});
require(["application/bootstrapmap",
         "esri/layers/ArcGISDynamicMapServiceLayer",
         "esri/layers/ArcGISTiledMapServiceLayer",
         "esri/geometry/Extent",
         "esri/SpatialReference",
         "esri/dijit/BasemapLayer",
         "esri/dijit/Basemap",
         "esri/dijit/BasemapGallery",
         "esri/dijit/Geocoder",
         "esri/tasks/IdentifyParameters",
         "esri/tasks/IdentifyTask",
         "agsjs/dijit/TOC",
         "esri/graphic",
         "esri/symbols/SimpleFillSymbol",
         "esri/symbols/SimpleMarkerSymbol",
         "esri/symbols/SimpleLineSymbol",
         "esri/dijit/Measurement",
         "esri/tasks/GeometryService",
         "esri/units",
         "dojo/_base/Color",         
         "dojo/dom",
         "dojo/dom-style",
         "dojo/dom-class",
         "dojo/on",
         "dojo/query",
         "dojo/domReady!"], 
  function(BootstrapMap, 
    ArcGISDynamicMapServiceLayer, 
    ArcGISTiledMapServiceLayer, 
    Extent, 
    SpatialReference, 
    BasemapLayer, 
    Basemap, 
    BasemapGallery,
    Geocoder,
    IdentifyParameters,
    IdentifyTask,
    TOC,
    Graphic,
    SimpleFillSymbol,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    Measurement,
    GeometryService,
    Units,
    Color,
    dom,
    domStyle,
    domClass,
    on,
    query)
    {

      on(dom.byId("searchBtnDiv"), "click", function (evt) {
        ToggleTools("searchTool");
      });

      on(dom.byId("woBtnDiv"), "click", function (evt) {
        ToggleTools("workorderTool");
      });

      on(dom.byId("measureBtnDiv"), "click", function (evt) {
        ToggleTools("measureTool");
      });


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

      identifyTask = new IdentifyTask("http://maps.lrwu.com/wa/rest/services/MoreLayers/MapServer");

      // Add geocoder for addresses

      var gc;
      gc = [{
        url: "http://maps.lrwu.com/wa/rest/services/BPADD_SingleField/GeocodeServer",
        name: "BPADD_SingleField",
        singleLineFieldName: "Single Line Input",
        placeholder: "Enter Address"
      }];

      geocoder = new Geocoder({
        map: map,
        autoComplete: true,
        autoNavigate: true,
        zoomScale: 3000,
        geocoders: gc,
        arcgisGeocoder: false
      }, "addrsearch");
      geocoder.startup();
      var handle = on(geocoder, "select", zoomTo);    


      // Add Geocoder for manholes

      var gcMH;
      gcMH = [{
        url: "http://maps.lrwu.com/wa/rest/services/Manholes_SingleField/GeocodeServer",
        name: "Manholes_SingleField",
        singleLineFieldName: "Single Line Input",
        placeholder: "Enter Manhole"
      }];

      geocoderMH = new Geocoder({
        map: map,
        autoComplete: true,
        autoNavigate: true,
        zoomScale: 1000,
        geocoders: gcMH,
        arcgisGeocoder: false
      }, "manholesearch");
      geocoderMH.startup();
      var handleMH = on(geocoderMH, "select", zoomTo);


      // Add Geocoder for mapsheets

      var gcMS;
      gcMS = [{
        url: "http://maps.lrwu.com/wa/rest/services/Mapsheets_SingleField/GeocodeServer",
        name: "Mapsheets_SingleField",
        singleLineFieldName: "Single Line Input",
        placeholder: "Enter Mapsheet"
      }];

      geocoderMS = new Geocoder({
        map: map,
        autoComplete: true,
        autoNavigate: false,
        zoomScale: 1000,
        geocoders: gcMS,
        arcgisGeocoder: false
      }, "mapsheetsearch");
      geocoderMS.startup();
      var handleMS = on(geocoderMS, "select", getMSShape);


      // Add the measurement tool object and geometry service

      esriConfig.defaults.geometryService = new GeometryService("http://maps.lrwu.com/wa/rest/services/Utilities/Geometry/GeometryServer");
      var measurementTool = new Measurement({
        map: map,
        defaultAreaUnit: Units.ACRES,
        defaultLengthUnit: Units.FEET
      }, dom.byId("measurementDiv"));
      measurementTool.startup();


      function getMSShape(evt) {
        // Gets the mapssheet shape
        console.log("The return value is: ");
        console.log(evt.result.feature.geometry);

        identifyParams = new IdentifyParameters();
        identifyParams.tolerance = 1;
        identifyParams.returnGeometry = true;
        identifyParams.layerIds = [6];
        identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
        identifyParams.width = map.width;
        identifyParams.height = map.height;
        identifyParams.mapExtent = map.extent;
        identifyParams.geometry = evt.result.feature.geometry;
        identifyTask.execute(identifyParams, function (results) { zoomToMS(results); });
      }

      function zoomToMS(result) {
        // Put an outline of the mapsheet on the map and zoom to the user-selected mapsheet.  
        console.log("results from zoomToMS [0]");
        console.log(result[0].feature.geometry);

        var lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 255]), 3);
        var polySymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, lineSymbol, new Color([0, 0, 0]));
        var graphic = new Graphic(result[0].feature.geometry, polySymbol);
        map.graphics.add(graphic);
        //console.log("Extent: " + result[0].feature.geometry.getExtent)
        var msExtent = result[0].feature.geometry.getExtent().expand(1.25);
        map.setExtent(msExtent);

        //closeSearchTool();
      }  // End zoomToMs function


      function zoomTo(evt) {
        console.log("hello from zoomTo...");

        //map.graphics.clear();

        // Puts graphic on map to show where address is.
        var symbol = new esri.symbol.PictureMarkerSymbol({
          "angle": 0,
          "xoffset": 0,
          "yoffset": 10,
          "type": "esriPMS",
          "url": "images/GreenPin1LargeB.png",
          "contentType": "image/png",
          "width": 24,
          "height": 24
        });
        var graphic = new Graphic(evt.result.feature.geometry, symbol);
        map.graphics.add(graphic);

        //closeSearchTool();
      }  // End zoomTo function  


      function ToggleTools(toolId) {
        console.log("Hello from Toggle Tools: " + toolId);

        // If the calling tool is open, then close it and return.
        var callingNode = dom.byId(toolId);
        if (domClass.contains(callingNode, "showToolContainer")) {
          domClass.remove(callingNode, "showToolContainer");
          domClass.add(callingNode, "hideToolContainer");
          closeAndResetTool(toolId);
          return;
        }

        // First close all the tool divs, then run reset function, then open the one that called the function.
        query(".toolDisplayDiv").forEach(function(node){
          console.log(dojo.attr(node, "id"));
          if (domClass.contains(node, "showToolContainer")) {
            domClass.remove(node, "showToolContainer");
            domClass.add(node, "hideToolContainer");
            closeAndResetTool(dojo.attr(node, "id"))
          }
        });

        domClass.add(callingNode, "showToolContainer");
      } // End ToggleTools function


      function closeAndResetTool (toolId) {
        switch (toolId) {
          case "measureTool":
            measurementTool.clearResult();
            measurementTool.setTool("location", false);
            measurementTool.setTool("distance", false);
            measurementTool.setTool("area", false);
            break;
          case "searchTool":
            geocoder.clear();
            geocoderMH.clear();
            geocoderMS.clear();
            break;
          default:
            console.log("hit default for case statement!!!!!!!!");
        }

      }  // End closAndResetTool function

    });



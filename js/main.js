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
         "dijit/registry",
         "dojo/parser",
         "dijit/layout/BorderContainer",
         "dijit/layout/ContentPane",
         "dijit/layout/TabContainer",
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
    query,
    Registry,
    parser)
    {

      parser.parse();

      var theSewerTab = Registry.byId("sewerTab");
      var theMHTab = Registry.byId("mhTab");
      var theMSTab = Registry.byId("mapsheetTab");

      console.log("theSewerTab = " + theSewerTab);
      console.log("theMHTab = " + theMHTab);
      console.log("theMSTab = " + theMSTab);


      on(dom.byId("searchBtnDiv"), "click", function (evt) {
        ToggleTools("searchTool");
      });

      on(dom.byId("woBtnDiv"), "click", function (evt) {
        ToggleTools("workorderTool");
      });

      on(dom.byId("idBtnDiv"), "click", function (evt) {
        enableIdentifyTool();
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

      identifyTask = new IdentifyTask("http://maps.lrwu.com/wa/rest/services/MoreLayers/MapServer");

      var identifyFeatsTask;
      var identifyFeatsParams;
      var theInfoWin = Registry.byId("tabs").domNode;
      console.log("theInfoWin" + theInfoWin);

      map.on("load", function (evt) {
        //map.setLevel(4);
        map.setMapCursor("default");
        initMap();
      });


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

        clearAndResetTool("searchTool");
        ToggleTools("searchTool");

      }  // End zoomTo function  


      function ToggleTools(toolId) {
        console.log("Hello from Toggle Tools: " + toolId);

        // If the calling tool is open, then close it and return.
        var callingNode = dom.byId(toolId);
        if (domClass.contains(callingNode, "showToolContainer")) {
          domClass.remove(callingNode, "showToolContainer");
          domClass.add(callingNode, "hideToolContainer");
          clearAndResetTool(toolId);
          return;
        }

        // First close all the tool divs, then run reset function, then open the one that called the function.
        query(".toolDisplayDiv").forEach(function(node){
          console.log(dojo.attr(node, "id"));
          if (domClass.contains(node, "showToolContainer")) {
            domClass.remove(node, "showToolContainer");
            domClass.add(node, "hideToolContainer");
            clearAndResetTool(dojo.attr(node, "id"));
          }
        });

        domClass.add(callingNode, "showToolContainer");
      } // End ToggleTools function


      function clearAndResetTool (toolId) {
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

      function enableIdentifyTool() {
        console.log("hello from enableIdentifyTool");
        map.setMapCursor("crosshair");

        // For testing, toggle these 2 lines
        idClk = map.on("click", identifyFeatures);
        //idClk2 = map.on("click", foo);
        // End for testing

      }   // End enableIdentifyTool function   


      // For testing
      function foo(evt) {
        var content = "<i>Total features returned: 2</i><table border='1'><tr><th>UPS_MH</th><th>DWN_MH</th><th>PIPEDIAM</th><th>UNITTYPE</th><th>PIPETYPE</th><th>INSTDATE</th><th>UPDPTH</th><th>DOWNDPTH</th></tr><tr><td>9G087</td><td>9G090</td><td>6</td><td>GRAVTY</td><td>DIP</td><td>1/1/1994</td><td>5</td><td>5</td><tr><td>9G090</td><td>9H012</td><td>6</td><td>GRAVTY</td><td>DIP</td><td>1/1/1994</td><td>5</td><td>4</td></tr></table>";
        map.infoWindow.setContent(content);
        map.infoWindow.show(evt.mapPoint, map.getInfoWindowAnchor(evt.screenPoint));
      }
      // End for testing


      function identifyFeatures(evt) {
        map.graphics.clear();
        map.setMapCursor("wait");

        identifyFeatsParams.geometry = evt.mapPoint;
        identifyFeatsParams.mapExtent = map.extent;

        map.infoWindow.resize(415, 200);
        map.infoWindow.setTitle("Identify Results");


        //map.graphics.clear();
        identifyFeatsTask.execute(identifyFeatsParams, function (idResults) {
          addToMap(idResults, evt);
        });
      }  //End identifyFeatures function



      function initMap() {
        // Used to get attributes of features for Identify tool
        identifyFeatsTask = new IdentifyTask("http://maps.lrwu.com/wa/rest/services/QueryLayers/MapServer");
        identifyFeatsParams = new esri.tasks.IdentifyParameters();
        identifyFeatsParams.tolerance = 3;
        identifyFeatsParams.returnGeometry = true;
        identifyFeatsParams.layerIds = [0, 1, 2];
        identifyFeatsParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
        identifyFeatsParams.width = map.width;
        identifyFeatsParams.height = map.height;
        map.infoWindow.setContent(theInfoWin);

        showSewerSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 3);
      }  //End intitMap     

      function addToMap(idResults, evt) {
        console.log("hello from addToMap! Number of features: " + idResults.length);
        sewerResults = { displayFieldName: null, features: [] };
        mhResults = { displayFieldName: null, features: [] };
        mapsheetResults = { displayFieldName: null, features: [] };

        for (var i = 0, il = idResults.length; i < il; i++) {
          var idResult = idResults[i];
          if (idResult.layerId === 0) {
            console.log("idResult.displayFieldName = " + idResult.displayFieldName);
            mhResults.displayFieldName = idResult.displayFieldName;
            mhResults.features.push(idResult.feature);
          }
          else if (idResult.layerId === 1) {
            console.log("idResult.displayFieldName = " + idResult.displayFieldName);
            sewerResults.displayFieldName = idResult.displayFieldName;
            sewerResults.features.push(idResult.feature);
          }
          else if (idResult.layerId === 2) {
            console.log("idResult.displayFieldName = " + idResult.displayFieldName);
            mapsheetResults.displayFieldName = idResult.displayFieldName;
            mapsheetResults.features.push(idResult.feature);
          }
        }

        console.log("sewerResults.features.length = " + sewerResults.features.length);
        console.log("mhResults.features.length = " + mhResults.features.length);
        console.log("mapsheetResults.features.length = " + mapsheetResults.features.length);

        theSewerTab.setContent(layerTabContent(sewerResults, "sewerResults"));
        console.log("fixing to start theMHTab.setContent");
        theMHTab.setContent(layerTabContent(mhResults, "mhResults"));
        theMSTab.setContent(layerTabContent(mapsheetResults, "mapsheetResults"));

        map.infoWindow.show(evt.screenPoint, map.getInfoWindowAnchor(evt.screenPoint));
      }  // End addToMap

      function layerTabContent(layerResults, layerName) {
        console.log("hello from layerTabContent");
        var content = "";
        switch (layerName) {
          case "sewerResults":
            var features = layerResults.features;
            console.log("sewerResults again features.length = " + features.length);
            content = "<i>Total features returned: " + features.length + "</i>";
            content += "<table border='1'><tr><th>UPS_MH</th><th>DWN_MH</th><th>PIPEDIAM</th><th>UNITTYPE</th><th>PIPETYPE</th><th>INSTDATE</th><th>UPDPTH</th><th>DOWNDPTH</th></tr>";
            for (var i = 0, il = features.length; i < il; i++) {
              content += "<tr><td>" + features[i].attributes['UPS_MH'] + "</td>";
// " <a href='#' onclick='showFeature(" + layerName + ".features[" + i + "]); return false;'>(show)</a>
              content += "<td>" + features[i].attributes['DWN_MH'] + "</td>";
              content += "<td>" + features[i].attributes['PIPEDIAM'] + "</td>";
              content += "<td>" + features[i].attributes['UNITTYPE'] + "</td>";
              content += "<td>" + features[i].attributes['PIPETYPE'] + "</td>";
              content += "<td>" + features[i].attributes['INSTDATE'] + "</td>";
              content += "<td>" + features[i].attributes['UPDPTH'] + "</td>";
              content += "<td>" + features[i].attributes['DOWNDPTH'] + "</td>";
            }
            content += "</tr></table>";
            console.log("SewerResults content = " + content);
            break;
          case "mhResults":
            console.log("layerName = " + layerName);
            content = "<i>Total features returned: " + layerResults.features.length + "</i>";
            content += "<table border='1'><tr><th>MH_NO</th><th>SERVSTAT</th><th>MHDPTH</th><th>UNITTYPE</th><th>AREA</th><th>INSTDATE</th><th>DROPMH</th><th>OWN</th></tr>";
            for (var i = 0, il = layerResults.features.length; i < il; i++) {
              content += "<tr><td>" + layerResults.features[i].attributes['MH_NO'];
              content += "<td>" + layerResults.features[i].attributes['SERVSTAT'] + " </td>";
              content += "<td>" + layerResults.features[i].attributes['MHDPTH'] + " </td>";
              content += "<td>" + layerResults.features[i].attributes['UNITTYPE'] + " </td>";
              content += "<td>" + layerResults.features[i].attributes['AREA'] + " </td>";
              content += "<td>" + layerResults.features[i].attributes['INSTDATE'] + " </td>";
              content += "<td>" + layerResults.features[i].attributes['DROPMH'] + " </td>";
              content += "<td>" + layerResults.features[i].attributes['OWN'] + " </td>";
            }
            content += "</tr></table>";
            console.log("mhResults content = " + content);
            break;
          case "mapsheetResults":
            content = "<i>Total features returned: " + layerResults.features.length + "</i>";
            content += "<table border='1'><tr><th>MAPSHEET</th><th>QUARTER</th><th>SEC</th><th>TWN</th></tr>";
            for (var i = 0, il = layerResults.features.length; i < il; i++) {
              content += "<tr><td>" + layerResults.features[i].attributes['MSH'];
              content += "<td>" + layerResults.features[i].attributes['QUARTER'] + "</td>";
              content += "<td>" + layerResults.features[i].attributes['SEC'] + "</td>";
              content += "<td>" + layerResults.features[i].attributes['TWN'] + "</td>";
            }
            content += "</tr></table>";
            console.log("mapsheetResults content = " + content);
            break;
        }
        return content;
      }  // End layerTabContent
    });



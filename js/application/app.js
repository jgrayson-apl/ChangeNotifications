/*
 | Copyright 2016 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
  "boilerplate/ItemHelper",
  "boilerplate/UrlParamHelper",
  "dojo/i18n!./nls/resources",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Color",
  "dojo/colors",
  "dojo/number",
  "dojo/query",
  "dojo/on",
  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-geometry",
  "dojo/dom-construct",
  "dijit/ConfirmDialog",
  "esri/request",
  "esri/Graphic",
  "esri/identity/IdentityManager",
  "esri/core/watchUtils",
  "esri/core/promiseUtils",
  "esri/portal/Portal",
  "esri/geometry/Extent",
  "esri/geometry/Polygon",
  "esri/layers/Layer",
  "esri/layers/FeatureLayer",
  "esri/renderers/SimpleRenderer",
  "esri/renderers/UniqueValueRenderer",
  "esri/symbols/SimpleFillSymbol",
  "esri/widgets/Home",
  "esri/widgets/Search",
  "esri/widgets/LayerList",
  "esri/widgets/Legend",
  "esri/widgets/Print",
  "esri/widgets/ScaleBar",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Expand",
  "dojo/domReady!"
], function (ItemHelper, UrlParamHelper, i18n, declare, lang, array, Color, colors, number, query, on,
             dom, domAttr, domClass, domGeom, domConstruct, ConfirmDialog,
             esriRequest, Graphic, IdentityManager, watchUtils, promiseUtils, Portal,
             Extent, Polygon, Layer, FeatureLayer, SimpleRenderer, UniqueValueRenderer, SimpleFillSymbol,
             Home, Search, LayerList, Legend, Print, ScaleBar, BasemapGallery, Expand) {

  return declare(null, {

    constructor: function () {
      calcite.init();
    },

    /*
     "webmap": "230cbe4142254ebb8bc032279ab0ce2c",
     "webscene": "c1ef258749254c219a622feada62d1da",
     */

    config: null,
    direction: null,

    /**
     *
     * @param boilerplateResponse
     */
    init: function (boilerplateResponse) {
      if(boilerplateResponse) {
        this.direction = boilerplateResponse.direction;
        this.config = boilerplateResponse.config;
        this.settings = boilerplateResponse.settings;
        let boilerplateResults = boilerplateResponse.results;
        let webMapItem = boilerplateResults.webMapItem;
        let webSceneItem = boilerplateResults.webSceneItem;
        let groupData = boilerplateResults.group;

        document.documentElement.lang = boilerplateResponse.locale;

        this.urlParamHelper = new UrlParamHelper();
        this.itemHelper = new ItemHelper();

        this._setDirection();

        if(webMapItem) {
          this._createWebMap(webMapItem);
        } else if(webSceneItem) {
          this._createWebScene(webSceneItem);
        } else if(groupData) {
          this._createGroupGallery(groupData);
        } else {
          this.reportError(new Error("app:: Could not load an item to display"));
        }
      }
      else {
        this.reportError(new Error("app:: Boilerplate is not defined"));
      }
    },

    /**
     *
     * @param error
     * @returns {*}
     */
    reportError: function (error) {
      // remove loading class from body
      //domClass.remove(document.body, CSS.loading);
      //domClass.add(document.body, CSS.error);
      // an error occurred - notify the user. In this example we pull the string from the
      // resource.js file located in the nls folder because we've set the application up
      // for localization. If you don't need to support multiple languages you can hardcode the
      // strings here and comment out the call in index.html to get the localization strings.
      // set message
      let node = dom.byId("loading_message");
      if(node) {
        //node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
        node.innerHTML = "<h1><span></span>" + i18n.error + "</h1><p>" + error.message + "</p>";
      }
      return error;
    },

    /**
     *
     * @private
     */
    _setDirection: function () {
      let direction = this.direction;
      let dirNode = document.getElementsByTagName("html")[0];
      domAttr.set(dirNode, "dir", direction);
    },

    /**
     *
     * @param webMapItem
     * @private
     */
    _createWebMap: function (webMapItem) {
      this.itemHelper.createWebMap(webMapItem).then(function (map) {

        let viewProperties = {
          map: map,
          container: this.settings.webmap.containerId
        };

        if(!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));
        require(["esri/views/MapView"], function (MapView) {

          let view = new MapView(viewProperties);
          view.then(function (response) {
            this.urlParamHelper.addToView(view, this.config);
            this._ready(view);
          }.bind(this), this.reportError);

        }.bind(this));
      }.bind(this), this.reportError);
    },

    /**
     *
     * @param webSceneItem
     * @private
     */
    _createWebScene: function (webSceneItem) {
      this.itemHelper.createWebScene(webSceneItem).then(function (map) {

        let viewProperties = {
          map: map,
          container: this.settings.webscene.containerId
        };

        if(!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));
        require(["esri/views/SceneView"], function (SceneView) {

          let view = new SceneView(viewProperties);
          view.then(function (response) {
            this.urlParamHelper.addToView(view, this.config);
            this._ready(view);
          }.bind(this), this.reportError);
        }.bind(this));
      }.bind(this), this.reportError);
    },

    /**
     *
     * @param groupData
     * @private
     */
    _createGroupGallery: function (groupData) {
      let groupInfoData = groupData.infoData;
      let groupItemsData = groupData.itemsData;

      if(!groupInfoData || !groupItemsData || groupInfoData.total === 0 || groupInfoData instanceof Error) {
        this.reportError(new Error("app:: group data does not exist."));
        return;
      }

      let info = groupInfoData.results[0];
      let items = groupItemsData.results;

      this._ready();

      if(info && items) {
        let html = "";

        html += "<h1>" + info.title + "</h1>";

        html += "<ol>";

        items.forEach(function (item) {
          html += "<li>" + item.title + "</li>";
        });

        html += "</ol>";

        document.body.innerHTML = html;
      }

    },

    /**
     *
     * @private
     */
    _ready: function (view) {

      // TITLE //
      dom.byId("app-title-node").innerHTML = document.title = this.config.title;

      //
      // WIDGETS IN VIEW UI //
      //

      view.constraints = { rotationEnabled: false };

      // SCALEBAR //
      const scaleBar = new ScaleBar({ view: view, unit: "dual" });
      view.ui.add(scaleBar, { position: "bottom-left" });

      // HOME //
      const homeWidget = new Home({ view: view });
      view.ui.add(homeWidget, { position: "top-left", index: 1 });

      //
      // WIDGETS IN EXPAND //
      //

      // SEARCH //
      const searchWidget = new Search({
        view: view,
        container: domConstruct.create("div")
      });
      // EXPAND SEARCH //
      const toolsExpand = new Expand({
        view: view,
        content: searchWidget.domNode,
        expandIconClass: "esri-icon-search",
        expandTooltip: "Search"
      }, domConstruct.create("div", { className: "expand-container" }));
      view.ui.add(toolsExpand, "top-right");

      // BASEMAP GALLERY //
      const basemapGallery = new BasemapGallery({
        view: view,
        container: domConstruct.create("div")
      });
      // EXPAND BASEMAP GALLERY //
      const basemapGalleryExpand = new Expand({
        view: view,
        content: basemapGallery.domNode,
        expandIconClass: "esri-icon-basemap",
        expandTooltip: "Basemap"
      }, domConstruct.create("div", { className: "expand-container" }));
      view.ui.add(basemapGalleryExpand, "top-right");


      //
      // WIDGETS IN TAB PANES //
      //

      // LAYER LIST //
      const layerList = new LayerList({ view: view }, "layer-list-node");

      // LEGEND
      const legend = new Legend({ view: view }, "legend-node");

      // PRINT //
      const print = new Print({
        view: view,
        printServiceUrl: "//utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
      }, "print-node");


      // MAP DETAILS //
      this.displayMapDetails(view);

      // TOGGLE LEFT PANE //
      const toggleNode = dom.byId("toggle-left-panel");
      on(toggleNode, "click", function () {
        query(".ui-layout-left").toggleClass("hide");
        query(".ui-layout-center").toggleClass("column-17");
        query(".ui-layout-center").toggleClass("column-23");
        domClass.toggle(toggleNode, "icon-ui-collapse");
        domClass.toggle(toggleNode, "icon-ui-expand");
      }.bind(this));


      // TOGGLE SIGN IN/OUT //
      let signInNode = dom.byId("sign-in-node");
      let signOutNode = dom.byId("sign-out-node");
      let userNode = dom.byId("user-node");

      // SIGN IN //
      let userSignIn = function () {
        this.portal = new Portal({ authMode: "immediate" });
        this.portal.load().then(function () {
          //console.info(this.portal, this.portal.user);

          dom.byId("user-firstname-node").innerHTML = this.portal.user.fullName.split(" ")[0];
          dom.byId("user-fullname-node").innerHTML = this.portal.user.fullName;
          dom.byId("username-node").innerHTML = this.portal.user.username;
          dom.byId("user-thumb-node").src = this.portal.user.thumbnailUrl;

          domClass.add(signInNode, "hide");
          domClass.remove(userNode, "hide");

          // MAP DETAILS //
          this.displayMapDetails(view, this.portal);

        }.bind(this), console.warn);
      }.bind(this);

      // SIGN OUT //
      let userSignOut = function () {
        IdentityManager.destroyCredentials();
        this.portal = new Portal({});
        this.portal.load().then(function () {

          this.portal.user = null;
          domClass.remove(signInNode, "hide");
          domClass.add(userNode, "hide");

          // MAP DETAILS //
          this.displayMapDetails(view);

        }.bind(this));
      }.bind(this);

      // CALCITE CLICK EVENT //
      let calciteClick = calcite.click();
      calcite.addEvent(signInNode, calciteClick, userSignIn);
      calcite.addEvent(signOutNode, calciteClick, userSignOut);

      // PORTAL //
      this.portal = new Portal({});
      // CHECK THE SIGN IN STATUS WHEN APP LOADS //
      IdentityManager.checkSignInStatus(this.portal.url).then(function () {
        userSignIn();
      }.bind(this));

      // INITIALIZE LAYER CHANGE NOTIFICATIONS //
      this.initializeChangeNotifications(view);

    },

    /**
     *
     * @param view
     * @param portal
     */
    displayMapDetails: function (view, portal) {

      const item = view.map.portalItem;
      const itemLastModifiedDate = (new Date(item.modified)).toLocaleString();

      dom.byId("current-map-card-thumb").src = item.thumbnailUrl;
      dom.byId("current-map-card-thumb").alt = item.title;
      dom.byId("current-map-card-caption").innerHTML = lang.replace("A map by {owner}", item);
      dom.byId("current-map-card-caption").title = "Last modified on " + itemLastModifiedDate;
      dom.byId("current-map-card-title").innerHTML = item.title;
      dom.byId("current-map-card-title").href = lang.replace("//{urlKey}.{customBaseUrl}/home/item.html?id={id}", {
        urlKey: portal ? portal.urlKey : "www",
        customBaseUrl: portal ? portal.customBaseUrl : "arcgis.com",
        id: item.id
      });
      dom.byId("current-map-card-description").innerHTML = item.description;

    },

    /* ============================================================================================================= */

    /**
     *
     * @param view
     * @returns {*}
     * @private
     */
    _whenLayersLoaded: function (view) {
      return promiseUtils.eachAlways(view.map.layers.map(function (layer) {
        // TODO: WHAT IF LAYER IS ALREADY LOADED?
        return watchUtils.whenTrueOnce(layer, "loaded");
      }));
    },

    /**
     *
     * @param view
     */
    initializeChangeNotifications: function (view) {

      if(!this.updatesFeatureLayer) {
        this.updatesFeatureLayer = new FeatureLayer({
          id: "updates-layer",
          title: "Change Notifications",
          legendEnabled: false,
          geometryType: "polygon",
          spatialReference: view.spatialReference,
          source: [],
          objectIdField: "ObjectID",
          fields: [
            {
              name: "ObjectID",
              alias: "ObjectID",
              type: "oid"
            }
          ],
          renderer: new UniqueValueRenderer({
            field: "type",
            defaultSymbol: new SimpleFillSymbol({
              color: Color.named.red,
              outline: { color: Color.named.red, width: 1.0 }
            }),
            uniqueValueInfos: [
              {
                value: "full-changes-extent",
                label: "All Changes",
                symbol: new SimpleFillSymbol({
                  color: Color.named.transparent,
                  outline: { color: Color.named.white, type: "dash", width: 3.0 }
                })
              },
              {
                value: "changes-extent",
                label: "A Change",
                symbol: new SimpleFillSymbol({
                  color: Color.named.red.concat(0.25),
                  outline: { color: Color.named.darkred, width: 1.5 }
                })
              }
            ]
          })
        });
        view.map.add(this.updatesFeatureLayer);
      }

      // WAIT FOR LAYERS TO BE LOADED //
      //this._whenLayersLoaded(view).then(function () {

      // ADD FEATURE LAYERS TO CHANGE LAYER SELECT //
      const changeLayerSelect = dom.byId("changeLayerSelect");
      view.map.layers.filter(function (layer) {
        return ((layer.type === "feature") && layer.url != null);
      }).forEach(function (featureLayer) {
        // ADD SELECT OPTION FOR THE FEATURE LAYER //
        domConstruct.create("option", { value: featureLayer.id, innerHTML: featureLayer.title }, changeLayerSelect);
      }.bind(this));

      // SET CHANGE LAYER //
      this.setChangeNotificationLayer = function (layerId) {
        this.changeNotificationLayer = view.map.findLayerById(layerId);
      }.bind(this);

      on(changeLayerSelect, "change", function () {
        this.setChangeNotificationLayer(changeLayerSelect.value);
      }.bind(this));
      this.setChangeNotificationLayer(changeLayerSelect.value);


      // UPDATE INTERVAL //
      const updateIntervalSelect = dom.byId("updateIntervalSelect");
      this.updateInterval = +updateIntervalSelect.value;
      this.updateIntervalHandle = -1;
      on(updateIntervalSelect, "change", function () {
        clearInterval(this.updateIntervalHandle);
        this.updateInterval = +updateIntervalSelect.value;
        if(this.updateInterval > 0) {
          this.getChanges();
          this.updateIntervalHandle = setInterval(this.getChanges.bind(this), this.updateInterval);
        }
        this.toggleFetchButton((this.updateInterval > 0));
      }.bind(this));


      // RESET TIME TO NOW //
      on(dom.byId("reset-changes-link"), "click", this.resetChangesTrackingInfo.bind(this));

      // FETCH CHANGES //
      on(dom.byId("fetch-changes-btn"), "click", this.getChanges.bind(this));

      // GET CHANGE TRACKING INFO //
      this.view = view; // TODO: don't make view global...
      this.updateChangeTrackingInfo();

      //}.bind(this));

    },

    toggleFetchButton: function (disable) {
      domClass.toggle(dom.byId("fetch-changes-btn"), "btn-disabled", disable || (this.updateInterval > 0));
    },

    /**
     *
     * @param msg
     */
    updateStatus: function (msg) {
      dom.byId("change-status").innerHTML = msg || "";
    },

    /**
     *
     */
    resetChangesTrackingInfo: function () {
      this.updateChangeTrackingInfo().then(this.getChanges.bind(this));
    },

    /**
     *
     * @returns {Promise}
     */
    updateChangeTrackingInfo: function () {
      return this.getChangeTrackingInfo().then(function (changeTrackingInfo) {
        if(changeTrackingInfo) {
          dom.byId("last-update-label").innerHTML = (new Date()).toLocaleString();
          this.defaultLayerServerGens = changeTrackingInfo.layerServerGens;
          this.updateStatus("Change notifications ready.");
        } else {
          this.updateStatus("Warning: change tracking info not available for this layer.");
        }
      }.bind(this));
    },

    /**
     *
     * @returns {Promise}
     */
    getChangeTrackingInfo: function () {
      return esriRequest(this.changeNotificationLayer.url, {
        query: {
          f: "json",
          returnUpdates: true
        }
      }).then(function (response) {
        return response.data.changeTrackingInfo;
      });
    },

    /**
     *
     */
    getChanges: function () {
      if(this.defaultLayerServerGens) {

        // DISABLE BUTTON //
        this.toggleFetchButton(true);

        // EXTRACT CHANGES //
        this.extractChanges().then(function (response) {
          if(response.statusUrl) {
            this.getJobInfo(response.statusUrl).then(this.getJobInfoCallback.bind(this));
          } else {
            this.updateStatus("Warning: unable to get changes status url...");
          }
        }.bind(this));
      } else {
        this.updateStatus("Warning: change tracking info not available for this layer.");
      }
    },

    /**
     *
     * @returns {Promise}
     */
    extractChanges: function () {
      return esriRequest(this.changeNotificationLayer.url + "/extractChanges", {
        query: {
          f: "json",
          layers: JSON.stringify([this.changeNotificationLayer.layerId]),
          dataFormat: "json",
          layerServerGens: JSON.stringify(this.defaultLayerServerGens),
          returnInserts: true,
          returnUpdates: true,
          returnDeletes: true,
          returnExtentOnly: true,
          returnAttachments: false,
          returnAttachmentsDataByUrl: false,
          transportType: "esriTransportTypeUrl",
          outSR: 102100
        },
        method: "post"
      }).then(function (response) {
        return response.data;
      }.bind(this));
    },

    /**
     *
     * @param statusUrl
     * @returns {Promise}
     */
    getJobInfo: function (statusUrl) {
      return esriRequest(statusUrl, {
        query: {
          f: "json",
          dataFormat: "json"
        }
      }).then(function (response) {
        return {
          response: response,
          statusUrl: statusUrl
        };
      });
    },

    /**
     *
     * @param res
     */
    getJobInfoCallback: function (res) {
      let response = res.response;
      let statusUrl = res.statusUrl;

      if(response.data.status === "Completed") {
        this.updateStatus("...");
        let resultUrl = response.data.resultUrl;

        this.getExtentChanges(resultUrl).then(function (response) {
          //console.log("getExtentChanges: ", response);
          let fullChangesExtent = response.fullChangesExtent;
          if(fullChangesExtent) {
            this.updateStatus("Changes found.");
            // DISPLAY FULL CHANGES EXTENT //
            this.showFullChangesExtent(fullChangesExtent);
            // DISPLAY EACH EDIT EXTENT //
            response.edits.forEach(function (edit) {
              if(edit.changesExtent) {
                this.showChangesExtent(edit.changesExtent);
              }
            }.bind(this));
          } else {
            // NO CHANGES //
            this.updateStatus("No changes found.");
            this.updatesFeatureLayer.source.removeAll();
          }
          // ENABLE BUTTON //
          this.toggleFetchButton(false);

        }.bind(this));
      } else {
        this.updateStatus("Checking for changes...");
        setTimeout(function () {
          this.getJobInfo(statusUrl).then(this.getJobInfoCallback.bind(this));
        }.bind(this), 750);
      }
    },

    /**
     *
     * @param url
     * @returns {Promise}
     */
    getExtentChanges: function (url) {
      return esriRequest(url, {
        query: { f: "json" },
        useProxy: true
      }).then(function (response) {
        return response.data;
      }.bind(this));
    },

    /**
     *
     * @param extentJson
     */
    showFullChangesExtent: function (extentJson) {
      this.changeNotificationLayer.definitionExpression = "1=1";
      this.updatesFeatureLayer.source.removeAll();
      this.showChangesExtent(extentJson, "full-changes-extent")
    },

    /**
     *
     * @param extentJson
     * @param type
     */
    showChangesExtent: function (extentJson, type) {
      extentJson.spatialReference = this.view.spatialReference.toJSON();
      const extentGraphic = new Graphic({
        geometry: Polygon.fromExtent(new Extent(extentJson)),
        attributes: { type: type || "changes-extent" }
      });
      this.updatesFeatureLayer.source.add(extentGraphic);
    }

  });
});

var renderedEntities = [];

var templates = {
  case: undefined,
  property: undefined,
  method: undefined,
  entity: undefined,
  data: undefined,

  setup: function() {
    this.case = document.getElementById("case").innerHTML;
    this.property = document.getElementById("property").innerHTML;
    this.method = document.getElementById("method").innerHTML;
    this.entity = document.getElementById("entity").innerHTML;
    this.data = document.getElementById("data").innerHTML;

    Mustache.parse(this.case);
    Mustache.parse(this.property);
    Mustache.parse(this.method);
    Mustache.parse(this.entity);
    Mustache.parse(this.data);
  }
};

var centralEdgeLengthMultiplier = 1;
var network = undefined;

function bindValues() {
  setSize();
  createDiagram();
}

function setSize() {
  var width = $(window).width();
  var height = $(window).height();

  $("#classDiagram").width(width - 5);
  $("#classDiagram").height(height - 5);
}

function createDiagram() {
  var nodes = [];
  var edges = [];

  var maxEdgeLength = 0;

  for (var i = 0; i < entities.length; i++) {
    var entity = entities[i];
    var hasDependencies = false;

    // Added as workaround for fix the unnamed extensions
      
    // To get the png image from the network object of vis
    // reference: https://stackoverflow.com/questions/42663203/export-visjs-network-to-jpeg-png-image
    // network.on("afterDrawing", function (ctx) {console.info(ctx.canvas.toDataURL({format: 'png', quality: 1.0}));});
    // convert: https://onlinepngtools.com/convert-base64-to-png
      
    // TODO: use filter
    if (typeof entity.name === 'undefined') {
        for (var j = 0; j < entities.length; j++) {
            var ent = entities[j];
            if(!(typeof ent.extensions === 'undefined')) {
                // Find the extension id in the entity extensions array of id's
                // TODO: use filter
                
//                var fent = ent.extensions.filter(x => x.id === entity.id)
//                if (fent.length == 1) {
//                    entity.name = fent[0].name
//                }
                
                for (var x = 0; x < ent.extensions.length; x++) {
                    if (entity.id === ent.extensions[x]) {
                        // Update the entity extension name
                        entity.name = ent.name
                        break;
                    }
                }
            }
        }
    }
      
    // Fix the entity name from a generic type
    for (var j = 0; j < entities.length; j++) {
        var ent = entities[j];
        if (!(typeof ent.name === 'undefined')) {
            var name =  ent.name
            var n = name.indexOf('<');
            name = name.substring(0, n != -1 ? n : name.length);
            n = name.indexOf('>');
            name = name.substring(0, n != -1 ? n : name.length);
            ent.name = name
        }
    }
      
    maxEdgeLength = Math.max(maxEdgeLength, length);

    nodes.push({
      id: entity.id,
      font: { multi: "html", size: 12 , color: colorText},
      label: networkLabel(entity),
      color: color(entity.typeString),
      shape: "box"
    });

    if (entity.superClass != undefined && entity.superClass > 0) {
      edges.push({
        from: entity.superClass,
        to: entity.id,
        color: edgeColorSuperClass,
        label: "inherits",
        arrows: { from: true }
      });

      hasDependencies = true;
    }

    var extEdges = getEdges(
      entity.id,
      entity.extensions,
      length,
      "extends",
      edgeColorExtension,
      { from: true }
    );
    var proEdges = getEdges(
      entity.id,
      entity.protocols,
      length,
      "conforms to",
      edgeColorProtocol,
      { to: true }
    );
    var conEdges = getEdges(
      entity.id,
      entity.containedEntities,
      length,
      "contained in",
      edgeColorContainedIn,
      { from: true }
    );

    hasDependencies =
      hasDependencies &&
      extEdges.length > 0 &&
      proEdges.length > 0 &&
      conEdges.length > 0;

    edges = edges.concat(extEdges);
    edges = edges.concat(proEdges);
    edges = edges.concat(conEdges);
  }

  var container = document.getElementById("classDiagram");
  var data = {
    nodes: nodes,
    edges: edges
  };

// tested at http://visjs.org/examples/network/physics/physicsConfiguration.html
  let options = {
    edges: {
      smooth: false
    },
    physics: {
      forceAtlas2Based: {
        gravitationalConstant: -200,
        springLength: 0,
        avoidOverlap: 1
      },
      maxVelocity: 68,
      minVelocity: 0.14,
      solver: "forceAtlas2Based",
      timestep: 0.42
    },
    interaction: {
      navigationButtons: true,
      keyboard: true
    }
  };

    
  network = new vis.Network(container, data, options);
  // network.clusterByConnection(1);

  $("#entities").html("");
  $("img").remove();

  setTimeout(disablePhysics, 200);
}

function disablePhysics() {
  var options = {
    edges: { smooth: false },
    physics: { enabled: false }
  };
  network.setOptions(options);
  $(".loading-overlay").fadeOut("fast");
}

function getEdges(entityId, arrayToBind, edgeLength, label, color, arrows) {
  var result = [];
  if (arrayToBind != undefined && arrayToBind.length > 0) {
    for (var i = 0; i < arrayToBind.length; i++) {
      result.push({
        from: entityId,
        to: arrayToBind[i],
        length: edgeLength,
        color: color,
        label: label,
        arrows: arrows
      });
    }
  }
  return result;
}

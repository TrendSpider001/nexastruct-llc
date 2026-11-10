(function ($) {
  "use strict";

  function basePath() {
    var body = document.body;
    return body.getAttribute("data-asset-base") || "";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderServiceCard(service, options) {
    var base = options.base || "";
    var servicesPage = options.servicesPage || "services/index.html";
    var compact = options.compact;
    var href = servicesPage + "#" + service.slug;
    var img = NexaStructData.assetPath(service.image, base);
    var html =
      '<div class="ns-service-card-col"><article class="ns-service-card">' +
      '<div class="ns-card-media">' +
      '<img src="' +
      escapeHtml(img) +
      '" alt="' +
      escapeHtml(service.title) +
      '" loading="lazy" width="640" height="480">' +
      "</div>" +
      '<div class="ns-card-body">' +
      '<p class="ns-card-number">' +
      escapeHtml(service.id) +
      "</p>" +
      "<h3 class=\"ns-card-title\">" +
      escapeHtml(service.title) +
      "</h3>" +
      '<p class="ns-card-text">' +
      escapeHtml(service.shortDescription) +
      "</p>" +
      "</div></article></div>";
    return html;
  }

  function renderProjectCard(project, options) {
    var base = options.base || "";
    var detailBase = options.detailBase || "projects/detail.html";
    var href = detailBase + "?slug=" + encodeURIComponent(project.slug);
    var img = NexaStructData.assetPath(project.image, base);
    var tags = project.categories
      .map(function (c) {
        return '<span class="ns-tag">' + escapeHtml(c) + "</span>";
      })
      .join("");
    return (
      '<article class="ns-project-card" data-categories="' +
      escapeHtml(project.categories.join(" ")) +
      '">' +
      '<div class="ns-project-card-inner">' +
      '<div class="ns-card-media">' +
      '<img src="' +
      escapeHtml(img) +
      '" alt="' +
      escapeHtml(project.title) +
      '" loading="lazy" width="800" height="600"></a>' +
      "</div>" +
      '<div class="ns-card-body">' +
      '<div class="ns-card-tags">' +
      tags +
      "</div>" +
      '<h3 class=\"ns-card-title\">' +
      escapeHtml(project.title) +
      "</h3>" +
      '<p class="ns-card-meta">' +
      escapeHtml(project.servicesLabel) +
      "</p>" +
      '<p class="ns-card-text">' +
      escapeHtml(project.description) +
      "</p>" +
      "</div></div></article>"
    );
  }

  function initServicesPage() {
    var $grid = $("#ns-services-grid");
    var $details = $("#ns-services-details");
    if (!$grid.length) return;
    var base = basePath();
    var html = "";
    NexaStructData.services.forEach(function (s) {
      html += renderServiceCard(s, { base: base, servicesPage: "index.html" });
    });
    $grid.html(html);

    var detailHtml = "";
    NexaStructData.services.forEach(function (s) {
      var items = s.items
        .map(function (item) {
          return "<li>" + escapeHtml(item) + "</li>";
        })
        .join("");
      detailHtml +=
        '<section class="ns-service-detail" id="' +
        escapeHtml(s.slug) +
        '">' +
        '<p class="ns-card-number">' +
        escapeHtml(s.id) +
        "</p>" +
        "<h3>" +
        escapeHtml(s.title) +
        "</h3>" +
        '<p class="ns-detail-lead">' +
        escapeHtml(s.shortDescription) +
        "</p>" +
        '<ul class="ns-service-list">' +
        items +
        "</ul></section>";
    });
    $details.html(detailHtml);
  }

  function initProjectsPage() {
    var $grid = $("#ns-projects-grid");
    var $filters = $("#ns-project-filters");
    if (!$grid.length) return;
    var base = basePath();

    NexaStructData.filterCategories.forEach(function (cat, idx) {
      $filters.append(
        '<button type="button" class="' +
          (idx === 0 ? "is-active" : "") +
          '" data-filter="' +
          escapeHtml(cat) +
          '">' +
          escapeHtml(cat) +
          "</button>"
      );
    });

    var cards = "";
    NexaStructData.projects.forEach(function (p) {
      cards += renderProjectCard(p, { base: base, detailBase: "detail.html" });
    });
    $grid.html(cards);

    $filters.on("click", "button", function () {
      var filter = $(this).data("filter");
      $filters.find("button").removeClass("is-active");
      $(this).addClass("is-active");
      $grid.find(".ns-project-card").each(function () {
        var cats = $(this).attr("data-categories") || "";
        var show = filter === "All" || cats.indexOf(filter) !== -1;
        $(this).toggle(show);
      });
    });
  }

  function getQueryParam(name) {
    var match = new RegExp("[?&]" + name + "=([^&]*)").exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
  }

  function initProjectDetail() {
    var $root = $("#ns-project-detail-root");
    if (!$root.length) return;
    var slug = getQueryParam("slug");
    var project = slug && NexaStructData.getProjectBySlug(slug);
    var base = basePath();

    if (!project) {
      $root.html(
        '<div class="container section-padding"><p>Project not found.</p><p><a href="index.html">Back to projects</a></p></div>'
      );
      document.title = "Project | NexaStruct";
      return;
    }

    document.title = project.title + " | NexaStruct Projects | NexaStruct";

    var gallery = project.gallery
      .map(function (src, i) {
        var path = NexaStructData.assetPath(src, base);
        return (
          '<a href="' +
          escapeHtml(path) +
          '" class="fancybox" data-fancybox-group="gallery" title="' +
          escapeHtml(project.title) +
          '">' +
          '<img src="' +
          escapeHtml(path) +
          '" alt="' +
          escapeHtml(project.title) +
          '" loading="lazy" width="800" height="600">' +
          "</a>"
        );
      })
      .join("");

    var scope = project.services
      .map(function (s) {
        return "<li><span>" + escapeHtml(s) + "</span></li>";
      })
      .join("");

    var overview = project.overview
      .map(function (p) {
        return "<p>" + escapeHtml(p) + "</p>";
      })
      .join("");

    var related = NexaStructData.getRelatedProjects(project.slug, 3);
    var relatedHtml = related
      .map(function (p) {
        return renderProjectCard(p, { base: base, detailBase: "detail.html" });
      })
      .join("");

    var heroImg = NexaStructData.assetPath(project.image, base);

    $root.html(
      '<section class="ns-project-detail-hero">' +
        '<img src="' +
        escapeHtml(heroImg) +
        '" alt="" loading="eager">' +
        '<div class="container">' +
        "<h1>" +
        escapeHtml(project.title) +
        "</h1>" +
        '<p class="ns-hero-sub">' +
        escapeHtml(project.servicesLabel) +
        "</p>" +
        "</div></section>" +
        '<section class="section-padding"><div class="container">' +
        '<p class="ns-representative-note"><strong>Representative portfolio example.</strong> This page illustrates typical scope and deliverables. Replace with verified NexaStruct project information, imagery, and metadata when available.</p>' +
        "<h2>Project Overview</h2>" +
        overview +
        '<h2>Project Information</h2>' +
        '<dl class="ns-info-grid">' +
        "<dt>Project Type</dt><dd>" +
        escapeHtml(project.categories.join(", ")) +
        "</dd>" +
        "<dt>Services</dt><dd>" +
        escapeHtml(project.servicesLabel) +
        "</dd>" +
        "</dl>" +
        "<h2>Scope of Work</h2>" +
        '<ul class="ns-scope-list">' +
        scope +
        "</ul>" +
        "<h2>Design &amp; Engineering</h2>" +
        "<p>" +
        escapeHtml(project.description) +
        "</p>" +
        "<h2>Project Gallery</h2>" +
        '<div class="ns-gallery">' +
        gallery +
        "</div>" +
        "</div></section>" +
        '<section class="section-padding ns-related" style="background:#f8f8f8;"><div class="container">' +
        "<h2>Related Projects</h2>" +
        '<div class="ns-project-grid">' +
        relatedHtml +
        "</div></div></section>"
    );

    if ($.fn.fancybox) {
      $(".fancybox").fancybox();
    }
  }

  function initHomeSections() {
    var $svc = $("#ns-home-services-grid");
    if ($svc.length) {
      var base = basePath();
      var html = "";
      NexaStructData.services.forEach(function (s) {
        html += renderServiceCard(s, {
          base: base,
          servicesPage: "services/index.html",
        });
      });
      $svc.html(html);
    }

    var $proj = $("#ns-home-projects-grid");
    if ($proj.length) {
      var baseP = basePath();
      var featured = NexaStructData.getFeaturedProjects(6);
      var phtml = "";
      featured.forEach(function (p) {
        phtml += renderProjectCard(p, {
          base: baseP,
          detailBase: "projects/detail.html",
          hideViewButton: true,
        });
      });
      $proj.html(phtml);
    }
  }

  $(function () {
    if (typeof NexaStructData === "undefined") return;
    initServicesPage();
    initProjectsPage();
    initProjectDetail();
    initHomeSections();
  });
})(jQuery);

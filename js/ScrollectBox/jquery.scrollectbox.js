/**
 * ScrollectBox jQuery plugin v1.0
 * by Alexander Wallin (http://www.afekenholm.se).
 *
 * Licensed under MIT (http://www.afekenholm.se/license.txt)
 * 
 * ScrollectBox lets you design scrollable select- and drop-down-menues
 * freely.
 * 
 * In one case (list-scrolling using the mouse wheel),
 * the jQuery Mouse Wheel Plugin by Brandon Aaron must be included.
 * @link http://brandonaaron.net/code/mousewheel/demos
 * 
 * For comments, discussion, propsals and/or development; please visit
 * http://www.afekenholm.se/scrollectbox-jquery-plugin or send a mail to
 * contact@afekenholm.se.
 * 
 * @author: Alexander Wallin (http://www.afekenholm.se)
 * @version: 1.0
 * @url: http://www.afekenholm.se/scrollectbox-jquery-plugin
 */
(function($){
	
	// In case of multiple elements, this ID will keep them separated.
	// Splendid for CSS.
	var scrollectBoxID = -1;

	$.scrollectBox = function(el, options){
		
		scrollectBoxID++;
		
		// Escape conflicts
		var base = this;
		
		// Set options
		base.options = $.extend({}, $.scrollectBox.defaults, options);
		
		// Cache elements
		base.el = el;
		if (base.el.tagName.toLowerCase() == 'select')	{
			base.$el = $("<div />");
			base.$select = (base.options.debug) ? $(el).css("opacity", "0.3")
												: $(el).hide();
		}
		else
			base.$el = $(el);
		
		// Vars used in plugin
		base.numSelectOptions = -1;
		base.numScrollableOptions = -1;
		base.upMaxY = 0;
		base.downMinY = 0;
		
		/**
		 * Bang bang.
		 */
		base.init = function(){
			
			// Check for chosen preset and fix contradicting options
			base.fixBaseOptions();
			
			// Build all HTML neccessary
			base.buildHTML();
			
			// Activate box
			base.activateBox();
			
			// Activate options
			if (base.options.optionType == 'link')
				base.activateOptionLinks();
			else if (base.options.optionType == 'option')
				base.activateOptionSelection();
			
			base.activateScrolling();
		};
		
		/**
		 * Escapes contradicting options
		 */
		base.fixBaseOptions = function(){
			
			// Options setup/fallback/assistance
			base.options.optionType = (base.el.tagName.toLowerCase() == 'select')
				? 'option' : 'link';
			if (base.options.scrollOn == 'hoveroutside')
				base.options.hideOn = 'click';
			
			// Presets
			if (base.options.preset == 'dropdown') {
				base.options.showOn = 'mouseover';
				base.options.hideOn = 'mouseout';
			}
			else if (base.options.preset == 'select') {
				base.options.showOn = 'click';
				base.options.hideOn = 'blur';
			}
		};
		
		/**
		 * Builds up this little DOM world of ours.
		 */
		base.buildHTML = function(){
			
			/* 
			 * If the element is a <select>-tag, build the new list
			 * from scratch.
			 */
			if (base.el.tagName.toLowerCase() == 'select') {
				
				// Insert our created <div> after the <select> element
				base.$select.after(base.$el);
				
				// Create headline
				base.$el.$headline = $("<div />").addClass("scrollectbox-headline")
						.html("option:first-child", base.$select).appendTo(base.$el);
				
				// Create the list
				base.$el.$list = $("<ul />").addClass("scrollectbox-list")
						.appendTo(base.$el);
				
				// Function for adding an option to the list
				var currentOptionID = 0;
				var _appendOption = function($obj, strClass){
					var $option = $("<li />");
					
					// Check if this object is the currently selected
					if ($obj.attr("selected") == true) strClass += " scrollectbox-option-selected";
							
					// Set up option and append to list 
					$option.addClass(strClass).attr({"data-optval":$obj.val()})
							.html("<a href='#'>"+$obj.html()+"</a>").appendTo(base.$el.$list);
					currentOptionID++;
				};
				
				// Loop through the select elements' children
				base.$select.children().each(function(){
					
					// If optgroup, setup the containing options accordingly
					if (this.tagName.toLowerCase() == 'optgroup') {
						base.$el.$list.append("<li class='scrollectbox-optgroup scrollectbox-scrollable'>" 
								+ $(this).attr("label") + "</li>\n");
						
						// Append all options in the optgroup
						$("option", this).each(function(){
							_appendOption($(this), "scrollectbox-optgroup-option");
						});
					}
					else // Bottom level option
						_appendOption($(this), "");
				});
			}
			else { 	/*
					 * Here we modify a regular div element, giving it the exact same
					 * structure as if it were a select element.
					 */
				
				// Create headline
				base.$el.$headline = $("<div />").addClass("scrollectbox-headline")
						.html(base.$el.attr("title")).appendTo(base.$el);
				
				// Create the drop-down list
				base.$el.$list = $("<ul />").addClass("scrollectbox-list").appendTo(base.$el);
				$("a", base.$el).prependTo(base.$el.$list).wrap("<li />");
			}
			
			// Add usable classes to the scrollectbox element
			base.$el.addClass("scrollectbox-" + scrollectBoxID 
					+ " scrollectbox scrollectbox-scrolltype-" + base.options.scrollOn);
			if (base.options.optionType == 'link')	base.$el.addClass("scrollectbox-nav");
			else									base.$el.addClass("scrollectbox-select");
			
			// Set width
			if (base.options.listWidth != null)
				base.$el.css("width", base.options.listWidth);
			else
				base.$el.$headline.css("min-width", base.$el.width()+"px");
			
			// Set height
			var headlineHeight = parseInt(base.$el.$headline.height()) 
					+ parseInt(base.$el.$headline.css("padding-top")) 
					+ parseInt(base.$el.$headline.css("padding-bottom"));
			base.$el.css("height", headlineHeight+"px");
			
			// Add an arrow element
			$("<div />").addClass("scrollectbox-arrow").prependTo(base.$el);
			
			// Put the list right z-below the headline
			base.$el.$list.css("z-index", parseInt(base.$el.$headline.css("z-index")) - 1);
			
			// Add neccessary classes and attributes the options
			base.numSelectOptions++;
			$("li", base.$el.$list).each(function(i, v){
				$(this).addClass("scrollectbox-scrollable");
				
				if (!$(this).hasClass("scrollectbox-optgroup")) {
					if ($(this).hasClass("scrollectbox-option-selected"))
						base.$el.$headline.html($(this).attr("data-optval"));
						
					$(this).addClass("scrollectbox-option");
				}	
				
				if (i >= base.options.numVisibleOptions)
					$(this).hide();
				
				base.numSelectOptions++;
			});
			
			// Add scroll buttons
			base.$up = $("<li />").addClass("scrollectbox-scroll-btn scrollectbox-scroll-prev scrollectbox-scroll-disabled")
					.prependTo(base.$el.$list);
			base.$down = $("<li />").addClass("scrollectbox-scroll-btn scrollectbox-scroll-next scrollectbox-scroll-enabled")
					.appendTo(base.$el.$list);
			
			// Add top and bottom <li>s, if one would want a margin or something
			$("<li />").addClass("scrollectbox-top-li").prependTo(base.$el.$list);
			$("<li />").addClass("scrollectbox-bottom-li").appendTo(base.$el.$list);
			
			// Hide the list
			base.$el.$list.hide();
		};
		
		/**
		 * Sets up the hiding and showing of the list.
		 */
		base.activateBox = function(){
			
			// Hover
			if (base.options.showOn == 'mouseover')
				base.$el.hover(base.showList, base.hideCurrentList);
			else { // Click & blur
				
				// Remove the event listener listening to clicks in the document
				// Then, listen to clicks on our box and show the list when it occurs
				var _clickWillShowList = function(){
					$(document).unbind("click", base.hideCurrentList);
					base.$el.click(base.showList);
				};

				// Remove the event listener listening to clicks on our box
				// Then, listen to clicks in document and hide list when it occurs
				var _clickWillHideList = function(){
					base.$el.unbind("click", base.showList);
					$(document).click(base.hideCurrentList);
				};
				
				base.$el.hover(_clickWillShowList, _clickWillHideList);
			}
		};
		
		/**
		 * If the options are links, this method sets up the functionality 
		 * of those links.
		 */
		base.activateOptionLinks = function(){
			
			var $optionElements = $("li > a", base.$el.$list);
			
			// If one exists, set the select handler to the custom one given by the user
			if (base.options.onSelectEvent != null) {
				$optionElements.click(function(event){
					return base.options.onSelectEvent($(this), event);
				});
			}
			// Otherwise, set up a standard select behaviour
			else {
				$optionElements.click(function(event){

					// If one exists, invoke custom onselect function
					try { base.options.onSelectFunc($(this), event); } catch(err) {}
					
					base.optionClicked($(this));
					
					// Return possible fu
					if (base.options.followLink == false)
						return false;
				});
			}
		};
		
		/**
		 * If the options are actually options in a select element,
		 * this method sets up the functionality of those options.
		 */
		base.activateOptionSelection = function(){
			var $optionElements = $(".scrollectbox-option > a", base.$el.$list);
			
			if (base.options.onSelectEvent != null) {
				$optionElements.click(function(event){
					return base.options.onSelectEvent($(this), event);
				});
			}
			else {
				$optionElements.click(function(event){
					
					// If one exists, invoke custom onselect function
					try { base.options.onSelectFunc($(this), event); } catch(err) {}
					
					base.optionClicked($(this));
					
					// Switch selected option in the <select> element
					$("option[selected]", base.$select).removeAttr("selected");
					$("option[value=" + $(this).parent().attr("data-optval") + "]", base.$select).attr("selected", "selected");

					return false;
				});
			}
		};
		
		// All actions that should be taken, regardless of the given settings
		base.optionClicked = function($opt){
			
			// Hide the list?
			if (base.options.hideOnSelect) base.hideCurrentList();
			
			// Update headline?
			if (base.options.showCurrentOptionsAsHeadline) 
				base.$el.$headline.html($opt.html());
			
			// Set the selected option as, that's right, selected
			$(".scrollectbox-option-selected", base.$el.$list)
					.removeClass("scrollectbox-option-selected");
			$opt.parent().addClass("scrollectbox-option-selected");
		};
		
		/**
		 * Sets up the scrolling funcitonality of the list.
		 */
		base.activateScrolling = function(){
			
			// Check if we even need to scroll. If not, hide scroll buttons och run!
			if (base.options.numVisibleOptions <= 0 
					|| base.numSelectOptions <= base.options.numVisibleOptions) {
				$("li.scrollectbox-scrollable", base.$el.$list).each(function(){
					$(this).show();
				});
				base.$up.hide();
				base.$down.hide();
				return;
			}
			
			// Store the number of scrollable options
			base.numScrollableOptions = $("li.scrollectbox-scrollable", base.$el.$list).size();
			
			base.visibleOptionTop = 0;
			base.visibleOptionBottom = base.options.numVisibleOptions - 1;
			
			// Disabling the selection that occurs when scrolling repeatedly
			// (IE-hack)
			base.$el.$headline.each(function(){
				this.onselectstart = function() { return false; }; 
				this.unselectable = "on";
				//$(this).css({"-moz-user-select":"none", "-webkit-user-select":"none"});
			});
			$("li", base.$el.$list).each(function(){
				this.onselectstart = function() { return false; }; 
				this.unselectable = "on";
			});
			
			var _scrollPrev = function(){
				
				// Check if there are more entries upwards
				if (base.visibleOptionTop > 0 && base.$el.$list.is(":visible")) {
					
					// Hide the option at the bottom and show the first hidden option at the top
					$("li.scrollectbox-scrollable:eq(" + base.visibleOptionBottom + ")", base.$el.$list).hide();
					base.visibleOptionBottom--;
					base.visibleOptionTop--;
					$("li.scrollectbox-scrollable:eq(" + base.visibleOptionTop + ")", base.$el.$list).show();
					
					// Enable the down button if it is disabled
					if (base.$down.hasClass("scrollectbox-scroll-disabled"))
						base.$down.toggleScrollOnOff('enable');
					
					if (base.visibleOptionTop == 0)
						base.$up.toggleScrollOnOff('disable');
				}
			};
			
			var _scrollNext = function(){
				
				// If there are more entries to show
				if (base.visibleOptionBottom + 1 < base.numScrollableOptions && base.$el.$list.is(":visible")) {
					
					// Enable up button if disabled
					if (base.$up.hasClass("scrollectbox-scroll-disabled")) {
						base.$up.toggleScrollOnOff('enable');
					}
					
					// Hide the upmost option and show the next option downwards
					$("li.scrollectbox-scrollable:eq(" + base.visibleOptionTop + ")", base.$el.$list).hide();
					base.visibleOptionTop++;
					base.visibleOptionBottom++;
					$("li.scrollectbox-scrollable:eq(" + base.visibleOptionBottom + ")", base.$el.$list).show();

					// If we have reached the end, disable the down button and enable
					// the up button
					if (base.visibleOptionBottom + 1 == base.numScrollableOptions)
						base.$down.toggleScrollOnOff('disable');
				}
			};
			
			// Finally, listen to the specified event of the down and up buttons
			if (base.options.scrollOn == 'click') {
				base.$up.click(_scrollPrev);
				base.$down.click(_scrollNext);
			}
			else if (base.options.scrollOn == 'hover') {
				
				// Initially set to false, as the user does not want scroll upwards just to 
				// get the mouse onto the list. Once an option has been hovered, the list
				// may scroll upwards.
				base.mayScrollUp = false;
				
				// Init timerId
				var timerId = null,
					timerId2 = null;
				
				base.$el.bind("showList", function(){
					
					// When an option is hovered, enabled scrolling upwards
					var _enableScrollingUpwards = function(){
						base.mayScrollUp = true;
						$("li.scrollectbox-option").unbind("mouseover", _enableScrollingUpwards);
					};
					$("li.scrollectbox-option").mouseover(_enableScrollingUpwards);
					
					// Set up hovering
					base.$up.hover(
						function() { if (timerId == null && base.mayScrollUp == true) timerId = setInterval(_scrollPrev, base.options.scrollInterval); },
						function() { clearInterval(timerId); timerId = null; });
					base.$down.hover(
						function() { if (timerId2 == null) timerId2 = setInterval(_scrollNext, base.options.scrollInterval); },
						function() { clearInterval(timerId2); timerId2 = null; });
				}).bind("hideList", function(){
					
					// I shall cleanse these forests. 
					base.mayScrollUp = false;
					base.$up.unbind("hover");
					base.$down.unbind("hover");
					timerId = null;
					timerId2 = null;
				});
				
			}
			else if (base.options.scrollOn == 'hoveroutside') {
				
				// See 'hover'.
				base.mayScrollUp = false;
				
				// Init timerId
				var timerId1 = null,
					timerId2 = null;
				
				// Listen to showList event
				base.$el.bind("showList", function(){
					
					// Get scrollbuttons positions
					base.upMaxY = (base.$up.size() > 0) ? base.$up.offset().top + base.$up.height() : 0; // Used on 'hoveroutside' scrolling
					base.downMinY = (base.$down.size() > 0) ? base.$down.offset().top : 0;
					
					// Get left and right bounds of the list
					base.elXMin = base.$el.$list.offset().left;
					base.elXMax = base.elXMin + base.$el.$list.width() + parseInt(base.$el.$list.css("padding-left"))
							+ parseInt(base.$el.$list.css("padding-right"));
					
					$(document).bind("mousemove", function(e){
						
						// When an option is hovered, enabled scrolling upwards
						var _enableScrollingUpwards = function(){
							base.mayScrollUp = true;
							$("li.scrollectbox-option").unbind("mouseover", _enableScrollingUpwards);
						};
						$("li.scrollectbox-option").mouseover(_enableScrollingUpwards);
						
						// Start scroll timer if the mouse reaches the up button and is inside the list bounds
						if (!timerId1 && base.mayScrollUp && e.pageY <= base.upMaxY 
								&& e.pageX >= base.elXMin && e.pageX <= base.elXMax)
							timerId1 = setInterval(_scrollPrev, base.options.scrollInterval);
						else if (e.pageY > base.upMaxY) { 
							
							// The mouse is below the up button, abort scrolling
							clearInterval(timerId1);
							timerId1 = null;
						}
						
						// Start scroll timer if the mouse reaches the down button and is inside the list bounds
						if (!timerId2 && e.pageY >= base.downMinY
								&& e.pageX >= base.elXMin && e.pageX <= base.elXMax)
							timerId2 = setInterval(_scrollNext, base.options.scrollInterval);
						else if (e.pageY < base.downMinY) {
							
							// The mouse is above the down button, abort scrolling
							clearInterval(timerId2);
							timerId2 = null;
						}
					});
				}).bind("hideList", function(){
					
					// I kill you.
					base.mayScrollUp = false;
					clearInterval(timerId1);
					clearInterval(timerId2);
					$(document).unbind("mousemove");
				});
			}
			else if (base.options.scrollOn == 'scroll') {
				
				base.$el.bind('showList', function(){
					
					// Enable scrolling of list
					base.$el.$list.bind('mousewheel', function(event, delta){
						if 		(delta > 0)	_scrollPrev();
						else if	(delta < 0)	_scrollNext();
					});
				}).bind('hideList', function(){
					base.$el.$list.unbind('mousewheel');
				});
			}
		};
		
		/** Shows the list. */
		base.showList = function() {
			if (base.$el.$list.is(":visible")) return;
			
			// Hide currently open lists
			$(".scrollectbox-opened").each(function(){
				base.hideOtherList($(".scrollectbox-list", this));
			});
			
			base.$el.addClass("scrollectbox-opened");
			
			// Setup new z-index, so that the list will always be on top of other lists
			var elZ = parseInt(base.$el.css("z-index"));
			var listZ = parseInt(base.$el.$list.css("z-index"));
			if (elZ != 0 && !elZ)		elZ = 1;
			if (listZ != 0 && !listZ)	listZ = 0;
			
			base.$el.css("z-index", elZ + 10);
			base.$el.$list.css("z-index", listZ + 10).show();
			
			// Trigger event for those setups that need it
			base.$el.trigger('showList');
		}
		
		/** Hides the list. */
		base.hideList = function($list) {
			var $listParent = $list.parent();
			$listParent.removeClass("scrollectbox-opened");
			
			// Reset the z-index to what it was
			if ($list.is(":visible")) {
				var elZ = parseInt($listParent.css("z-index"));
				var listZ = parseInt($list.css("z-index"));
				if (elZ != 0 && !elZ)		elZ = 11;
				if (listZ != 0 && !listZ)	listZ = 10;
		
				$listParent.css("z-index", elZ - 10);
				$list.css("z-index", listZ - 10).hide();
		
				// Trigger event
				$listParent.trigger('hideList');
			}
		}
		
		base.hideCurrentList = function(event) {
			base.hideList(base.$el.$list);
		};
		
		base.hideOtherList = function($otherList) {
			base.hideList($otherList);
		};
		
		// And the Lord said:
		base.init();
	};
	
	/**
	 * Toggles whether a scroll button is enabled or disabled.
	 */
	$.fn.toggleScrollOnOff = function(action) {
		this.toggleClass("scrollectbox-scroll-enabled")
			.toggleClass("scrollectbox-scroll-disabled");
	}
	
	// Default options
	$.scrollectBox.defaults = {
		numVisibleOptions:		8,
		showOn:					'mouseover', // 'click' 
		hideOn:					'mouseout', // 'blur'
		scrollOn:				'click', // 'hover', 'hoveroutside', 'scroll'
		scrollInterval:			250,
		followLink:				true,
		hideOnSelect:			true,
		onSelectEvent:			null, // custom onselect event handler
		onSelectFunc:			null, // custom extra function on select
		showCurrentOptionsAsHeadline: true,
		listWidth:				null,
		preset:					null, // 'dropdown', 'select'
		debug:					false 
	};

	// Is good, yes.
    $.fn.scrollectBox = function(options){
		return this.each(function(){
			(new $.scrollectBox(this, options));
		});
	};
})(jQuery);


/*! Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 *
 * Version: 3.0.3-pre
 * 
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener )
            for ( var i=types.length; i; )
                this.addEventListener( types[--i], handler, false );
        else
            this.onmousewheel = handler;
    },
    
    teardown: function() {
        if ( this.removeEventListener )
            for ( var i=types.length; i; )
                this.removeEventListener( types[--i], handler, false );
        else
            this.onmousewheel = null;
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true;
    
    event = $.event.fix(event || window.event);
    event.type = "mousewheel";
    
    if ( event.wheelDelta ) delta = event.wheelDelta/120;
    if ( event.detail     ) delta = -event.detail/3;
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta);

    return $.event.handle.apply(this, args);
}

})(jQuery);
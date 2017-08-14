# Animations-in-javascript
With this plugin you can create animations in pure JavaScript.

## Connect function

To connect the plugin, you need to add the following line to the "head" tag:
```ruby
<script type="text/javascript" src="dir/animations.js"></script>
```

Or you can connect the minified version of the plugin by adding the following line to the tag "head":

```ruby
<script type="text/javascript" src="dir/animations.min.js"></script>
```

## Run the function

```ruby
new Animate({parameters});
```

## Function Parameters

 - **duration** (default: `1200`)  
*Type: Number or String*  
A string or number determining how long the animation will run.

 - **easing** (default: `linear`)  
*Type: Array or String*  
A string indicating which easing function to use for the transition.

   *List of standard values:* "ease", "ease-in", "ease-out", "ease-in-out", "linear".
*How to specify the array correctly?* The array should be specified as "cubic-bezier" in CSS. *Example:* `easing: [0.215, 0.61, 0.355, 1]`

 - **list** (default: `true`)  
*Type: Boolean*  
When the animation starts, it is added to the `window.animateList` list, which is stored until the end animation. With this option, you can turn off adding an animation to the list.

 - **start**  
*Type: Function ()*  
A function to call when the animation begins.

 - **step**  
*Type: Function ( Number )*  
A function is called at each step of the change. Returns the percentage of animation completion.

 - **complete**  
*Type: Function ()*  
The function is called when the animation is fully completed.

 - **done**  
*Type: Function ()*  
The function is called when the animation is completed.

## Additional animation functions

 - **stop**  
   Stopping the function  

   Example:

   ```ruby
   var Anim = new Animate({parameters});
   Anim.stop();
   ```

   Or:

   ```ruby
   var Anim = new Animate({parameters});
   window.animateStop(Anim);
   ```

 - **pause**  
   Temporarily stops animation  

   Example:

    ```ruby
   var Anim = new Animate({parameters});
   Anim.pause();
   ```

   Or:

   ```ruby
   var Anim = new Animate({parameters});
   window.animatePause(Anim);
   ```

 - **play**  
   Running an animation after a temporary halt  

   Example:

   ```ruby
   var Anim = new Animate({parameters});
   Anim.play();
   ```

   Or:

   ```ruby
   var Anim = new Animate({parameters});
   window.animatePlay(Anim);
   ```

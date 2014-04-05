/**
 * @jsx React.DOM
 */

var React = require('react');
var CodeMirror = global.CodeMirror;
var JSXTransformer = global.JSXTransformer;
var Accordion = require('../../cjs/Accordion');
var Alert = require('../../cjs/Alert');
var Button = require('../../cjs/Button');
var ButtonGroup = require('../../cjs/ButtonGroup');
var ButtonToolbar = require('../../cjs/ButtonToolbar');
var DropdownButton = require('../../cjs/DropdownButton');
var SplitButton = require('../../cjs/SplitButton');
var Nav = require('../../cjs/Nav');
var NavItem = require('../../cjs/NavItem');
var MenuItem = require('../../cjs/MenuItem');
var Modal = require('../../cjs/Modal');
var OverlayTrigger = require('../../cjs/OverlayTrigger');
var OverlayTriggerMixin = require('../../cjs/OverlayTriggerMixin');
var Panel = require('../../cjs/Panel');
var PanelGroup = require('../../cjs/PanelGroup');
var ProgressBar = require('../../cjs/ProgressBar');
var TabbedArea = require('../../cjs/TabbedArea');
var TabPane = require('../../cjs/TabPane');
var Label = require('../../cjs/Label');
var Badge = require('../../cjs/Badge');
var Jumbotron = require('../../cjs/Jumbotron');
var PageHeader = require('../../cjs/PageHeader');
var Well = require('../../cjs/Well');
var Glyphicon = require('../../cjs/Glyphicon');

var IS_MOBILE = typeof navigator !== 'undefined' && (
  navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
  );

var CodeMirrorEditor = React.createClass({displayName: 'CodeMirrorEditor',
  componentDidMount: function() {
    if (IS_MOBILE) return;

    this.editor = CodeMirror.fromTextArea(this.refs.editor.getDOMNode(), {
      mode: 'javascript',
      lineNumbers: false,
      lineWrapping: true,
      matchBrackets: true,
      tabSize: 2,
      theme: 'solarized-light',
      readOnly: this.props.readOnly
    });
    this.editor.on('change', this.handleChange);
  },

  componentDidUpdate: function() {
    if (this.props.readOnly) {
      this.editor.setValue(this.props.codeText);
    }
  },

  handleChange: function() {
    if (!this.props.readOnly) {
      this.props.onChange && this.props.onChange(this.editor.getValue());
    }
  },

  render: function() {
    // wrap in a div to fully contain CodeMirror
    var editor;

    if (IS_MOBILE) {
      var preStyles = {overflow: 'scroll'};
      editor = React.DOM.pre( {style:preStyles}, this.props.codeText);
    } else {
      editor = React.DOM.textarea( {ref:"editor", defaultValue:this.props.codeText} );
    }

    return (
      React.DOM.div( {style:this.props.style, className:this.props.className}, 
        editor
      )
      );
  }
});

var selfCleaningTimeout = {
  componentDidUpdate: function() {
    clearTimeout(this.timeoutID);
  },

  setTimeout: function() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  }
};

var ReactPlayground = React.createClass({displayName: 'ReactPlayground',
  mixins: [selfCleaningTimeout],

  MODES: {JSX: 'JSX', JS: 'JS', NONE: null},

  propTypes: {
    codeText: React.PropTypes.string.isRequired,
    transformer: React.PropTypes.func,
    renderCode: React.PropTypes.bool
  },

  getDefaultProps: function() {
    return {
      transformer: function(code) {
        return JSXTransformer.transform(code).code;
      }
    };
  },

  getInitialState: function() {
    return {
      mode: this.MODES.NONE,
      code: this.props.codeText
    };
  },

  handleCodeChange: function(value) {
    this.setState({code: value});
    this.executeCode();
  },

  handleCodeModeSwitch: function(mode) {
    this.setState({mode: mode});
  },

  handleCodeModeToggle: function(e) {
    var mode;

    e.preventDefault();

    switch (this.state.mode) {
      case this.MODES.NONE:
        mode = this.MODES.JSX;
        break;
      case this.MODES.JSX:
      default:
        mode = this.MODES.NONE;
    }

    this.setState({mode: mode});
  },

  compileCode: function() {
    return this.props.transformer(this.state.code);
  },

  render: function() {
    var editor;

    if (this.state.mode !== this.MODES.NONE) {
       editor = (
           CodeMirrorEditor(
             {key:"jsx",
             onChange:this.handleCodeChange,
             className:"highlight",
             codeText:this.state.code})
        );
    }
    return (
      React.DOM.div( {className:"playground"}, 
        React.DOM.div( {className:'bs-example ' + this.props.exampleClassName}, 
          React.DOM.div( {ref:"mount"} )
        ),
        editor,
        React.DOM.a( {onClick:this.handleCodeModeToggle, href:"#"}, this.state.mode === this.MODES.NONE ? 'show code' : 'hide code')
      )
      );
  },

  componentDidMount: function() {
    this.executeCode();
  },

  componentWillUpdate: function(nextProps, nextState) {
    // execute code only when the state's not being updated by switching tab
    // this avoids re-displaying the error, which comes after a certain delay
    if (this.state.code !== nextState.code) {
      this.executeCode();
    }
  },

  executeCode: function() {
    var mountNode = this.refs.mount.getDOMNode();

    try {
      React.unmountComponentAtNode(mountNode);
    } catch (e) { }

    try {
      var compiledCode = this.compileCode();
      if (this.props.renderCode) {
        React.renderComponent(
          CodeMirrorEditor( {codeText:compiledCode, readOnly:true} ),
          mountNode
        );
      } else {
        eval(compiledCode);
      }
    } catch (err) {
      this.setTimeout(function() {
        React.renderComponent(
          Alert( {bsStyle:"danger"}, err.toString()),
          mountNode
        );
      }, 500);
    }
  }
});

module.exports = ReactPlayground;
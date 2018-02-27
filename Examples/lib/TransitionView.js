import React from 'react';
import { View, Animated, UIManager } from 'react-native';
import PropTypes from 'prop-types';

import TransitionItem from './TransitionItem';

import ScaleTransition from './Transitions/ScaleTransitions';
import TopTransition from './Transitions/TopTransition';
import BottomTransition from './Transitions/BottomTransition';
import LeftTransition from './Transitions/LeftTransition';
import RightTransition from './Transitions/RightTransition';
import HorizontalTransition from './Transitions/HorizontalTransition';
import VerticalTransition from './Transitions/VerticalTransition';

let uniqueBaseId = `transitionCompId-${Date.now()}`;
let uuidCount = 0;

class Transition extends React.Component {
	constructor(props, context){
		super(props, context);
		this._name = `${uniqueBaseId}-${uuidCount++}`;
		this._transitionHelper = null;		
	}

	_name
	_route
	_isMounted
	_transitionHelper
	_viewRef

	render() {
		// Get child
		let element = React.Children.only(this.props.children);
		console.log("TransitionView render " +
			(element.type ? element.type.displayName : "UNKNOWN") + " (" + this._getName() +
			"/" + this._route + ")");

		// Wrap buttons to be able to animate them
		if(element.type.name==='Button')
			element = (<View>{element}</View>);

		// Convert to animated component
		const animatedComp = Animated.createAnimatedComponent(element.type);

		// Build styles
		const style =  [element.props.style];
		const appearStyle = this.getAppearStyle();
		const transitionStyle = this.getTransitionStyle();

		// Save properties
		const props = {
			...element.props,
			onLayout: this.onLayout.bind(this),
			collapsable: false,
			style: [style, transitionStyle, appearStyle],
			ref: (ref) => this._viewRef = ref
		};

		return React.createElement(animatedComp, props);
	}

	getTransitionStyle() {
		const opacityStyle = {opacity: this.context.hiddenProgress.interpolate({
			inputRange:[0, 1],
			outputRange: [0, 1]
		})};

		const { getIsSharedElement, getMetrics } = this.context;
		if(!getIsSharedElement && !getMetrics) return;

		if(getIsSharedElement(this._getName(), this._route) || !this.props.appear)
			return {};

		if(!this.context.transitionProgress())
			return opacityStyle;

		const metrics = getMetrics(this._getName(), this._route);

		const transitionHelper = this.getTransitionHelper(this.props.appear);
		if(transitionHelper){
			const direction = this.context.direction(this._getName(), this._route);
			const transitionConfig = {
				progress: this.context.transitionProgress(),
				direction,
				metrics: metrics,
				start: direction === 1 ? 0 : 1,
				end: direction === 1 ? 1 : 0
			};
			return transitionHelper.getTransitionStyle(transitionConfig);
		}

		return {};
	}

	getAppearStyle() {
		const { getIsSharedElement, getIsTransitionElement } = this.context;
		if(getIsSharedElement(this._getName(), this._route)) {
			const interpolator = this.context.sharedProgress.interpolate({
				inputRange: [0, 0.5, 0.5, 1],
				outputRange: [1, 1, 0, 0],
			});
			return { opacity: interpolator };
		}

		return { };
	}

	async onLayout(event) {
		const { layoutReady } = this.context;
		if(!layoutReady) return;
		layoutReady(this._getName(), this._route, event.nativeEvent.target);
	}

	getViewRef() {
		return this._viewRef;
	}

	_getName(){
		if(this.props.shared)
			return this.props.shared;
		return this._name;
	}

	getTransitionHelper(appear){
		if(this._transitionHelper === null) {
			switch(appear){
				case 'top':
					this._transitionHelper = new TopTransition();
					break;
				case 'bottom':
					this._transitionHelper = new BottomTransition();
					break;
				case 'left':
					this._transitionHelper = new LeftTransition();
					break;
				case 'right':
					this._transitionHelper = new RightTransition();
					break;
				case 'horizontal':
					this._transitionHelper = new HorizontalTransition();
					break;
				case 'vertical':
					this._transitionHelper = new VerticalTransition();
					break;
				case 'scale':
					this._transitionHelper = new ScaleTransition();
					break;
				default:
					break;
			}
		}
		return this._transitionHelper;
	}

	static contextTypes = {
		register: PropTypes.func,
		unregister: PropTypes.func,
		route: PropTypes.string,
		sharedProgress: PropTypes.object,
		hiddenProgress: PropTypes.object,
		transitionProgress: PropTypes.func,
		getIsSharedElement: PropTypes.func,
		getIsTransitionElement: PropTypes.func,
		direction: PropTypes.func,
		layoutReady: PropTypes.func,
		getMetrics: PropTypes.func,
	}

	shouldComponentUpdate(nextProps, nextState){
		return true;
	}

	componentWillMount() {
		const register = this.context.register;
		if(register) {
			this._route = this.context.route;
			register(new TransitionItem(this._getName(), this.context.route,
				this, this.props.shared !== undefined, this.props.appear !== undefined,
				this.props.nodelay !== undefined));
		}
	}

	componentDidMount() {
		this._isMounted = true;
	}

	componentWillUnmount() {
		this._isMounted = false;
		const unregister = this.context.unregister;
		if(unregister) {
			unregister(this._getName(), this._route);
		}
	}
}

export default Transition;
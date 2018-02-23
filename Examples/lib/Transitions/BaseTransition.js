import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, Animated } from 'react-native';

import TransitionItem from './../TransitionItem';

let uniqueBaseId = `transitionCompId-${Date.now()}`;
let uuidCount = 0;

function generateKey() {
    return `${uniqueBaseId}-${uuidCount++}`;
}

class BaseTransition extends React.Component {
	constructor(props, context){
		super(props, context);
		this._name = generateKey();
		this._transitionProgress = new Animated.Value(0);
		this.state = {
			transitionConfiguration: null
		};
	}

	_transitionProgress
	_innerViewRef
	_route
	_name
	_innerViewRef

	setTransitionSpec(value, force = false){
		if(force){
			this.setState({...this.state, transitionConfiguration: value});
			return;
		}
		if(value === null && this.state.transitionConfiguration !== null)
			this.setState({...this.state, transitionConfiguration: value});
		else if(value !== null && this.state.transitionConfiguration === null)
			this.setState({...this.state, transitionConfiguration: {
				...value, 
				progress: this._transitionProgress}
			});
	}

	getTransitionSpec() {
		return this.state.transitionConfiguration;
	}

	render() {

		let element = React.Children.only(this.props.children);
		if(element.type.name==='Button')
			element = (<View>{element}</View>);

		const animatedComp = Animated.createAnimatedComponent(element.type);

		const style =  [element.props.style];
		const transitionStyle =
			this.getTransitionStyle(this.state.transitionConfiguration);

		const props = {
			...element.props,
			collapsable: false,
			style: [style, transitionStyle],
			ref: ref => this._innerViewRef = ref
		};

		return React.createElement(animatedComp, props);
	}
	getTransitionStyle(transitionConfiguration) {
		return {};
	}
	shouldComponentUpdate(nextProps, nextState){
		return nextState.transitionConfiguration !== this.state.transitionConfiguration;
	}
	getAnimationSpecs(animationSpecs){
		return animationSpecs;
	}
	getAnimation() {
		if(this.state.transitionConfiguration === null)
			return {};

		const animationSpecs = this.state.transitionConfiguration;
		const { start, end, delay, timing, config, metrics, direction } =
			this.getAnimationSpecs(animationSpecs);

		this._transitionProgress.setValue(start);
		const animation = timing(this._transitionProgress, {
			toValue: end,
			...config,
			delay: delay,
		});

		return animation;
	}
	componentDidMount() {
		const register = this.context.register;
		if(register) {
			this._route = this.context.route;
			register(new TransitionItem(this.props.shared ? this.props.shared : this._name, this.context.route,
				this, this.props.shared !== undefined, this.props.appear !== undefined, 
				this.props.nodelay !== undefined));
		}
	}
	componentWillUnmount() {
		const unregister = this.context.unregister;
		if(unregister) {
			if(this.props.shared)
				unregister(this.props.shared, this._route);
			else
				unregister(this._name, this._route);
		}
	}
	getReactElement() {
		return React.Children.only(this.props.children);
	}
	getInnerViewRef() {
		return this._innerViewRef;
	}
	getReactElement() {
		return React.Children.only(this.props.children);
	}
	static contextTypes = {
		register: PropTypes.func,
		unregister: PropTypes.func,
		appearProgress: PropTypes.object,
		transitionProgress: PropTypes.object,
		route: PropTypes.string,
	}
}

export default BaseTransition;
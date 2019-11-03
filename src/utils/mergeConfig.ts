import * as R from '../typings'
import validate from './validate'

const merge = (original: any, next: any): any => {
	return next ? { ...next, ...(original || {}) } : original || {}
}

const isObject = (obj: object): boolean =>
	Array.isArray(obj) || typeof obj !== 'object'

const isFunction = (value: any): value is Function =>
	value instanceof Function

/**
 * mergeConfig
 *
 * merge init configs together
 */
export default (initConfig: R.InitConfig & { name: string }): R.Config => {
	const config: R.Config = {
		name: initConfig.name,
		models: {},
		plugins: [],
		...initConfig,
		redux: {
			reducers: {},
			rootReducers: {},
			enhancers: [],
			middlewares: [],
			...initConfig.redux,
			devtoolOptions: {
				name: initConfig.name,
				...(initConfig.redux && initConfig.redux.devtoolOptions
					? initConfig.redux.devtoolOptions
					: {}),
			},
		},
	}

	if (process.env.NODE_ENV !== 'production') {
		validate([
			[!Array.isArray(config.plugins), 'init config.plugins must be an array'],
			[isObject(config.models), 'init config.models must be an object'],
			[
				isObject(config.redux.reducers),
				'init config.redux.reducers must be an object',
			],
			[
				!Array.isArray(config.redux.middlewares),
				'init config.redux.middlewares must be an array',
			],
			[
				!Array.isArray(config.redux.enhancers),
				'init config.redux.enhancers must be an array of functions',
			],
			[
				config.redux.combineReducers &&
				typeof config.redux.combineReducers !== 'function',
				'init config.redux.combineReducers must be a function',
			],
			[
				config.redux.createStore &&
				typeof config.redux.createStore !== 'function',
				'init config.redux.createStore must be a function',
			],
		])
	}

	// defaults
	for (const plugin of config.plugins) {
		let pluginConfig = isFunction(plugin.config) ? plugin.config(config) : plugin.config

		if (pluginConfig) {
			// models
			const models: R.Models = merge(config.models, pluginConfig.models)
			config.models = models

			// plugins
			config.plugins = [...config.plugins, ...(pluginConfig.plugins || [])]

			// redux
			if (pluginConfig.redux) {
				config.redux.initialState = merge(
					config.redux.initialState,
					pluginConfig.redux.initialState
				)
				config.redux.reducers = merge(
					config.redux.reducers,
					pluginConfig.redux.reducers
				)
				config.redux.rootReducers = merge(
					config.redux.rootReducers,
					pluginConfig.redux.reducers
				)
				config.redux.enhancers = [
					...config.redux.enhancers,
					...(pluginConfig.redux.enhancers || []),
				]
				config.redux.middlewares = [
					...config.redux.middlewares,
					...(pluginConfig.redux.middlewares || []),
				]
				config.redux.combineReducers =
					config.redux.combineReducers || pluginConfig.redux.combineReducers
				config.redux.createStore =
					config.redux.createStore || pluginConfig.redux.createStore
			}
		}
	}
	return config
}

import {
	login as loginAction,
	logout as logoutAction,
	setCredits as setCreditsAction,
	setSongs as setSongsAction,
	setThemes as setThemesAction,
	setVideos as setVideosAction,
	setQuestion,
	setComments,
	setUser,
	setUsers
} from './redux/actions'
import store from './redux/store'
import { toast } from 'react-toastify'

let apiurl = process.env.NODE_ENV === "development" ?
	'http://localhost:4001/api' :
	'/api'

// The jsonFetch function is a wrapper around the native fetch().
// It returns the response in json, and removes the "loggedIn" item
// from localStorage if the response status code is 401.
// Returns a promise that throws if the status code is not in the 200-399 range
const jsonFetch = (RequestInfo, RequestInit = {}) => {
	if (typeof RequestInfo === 'string') {
		RequestInfo = apiurl + RequestInfo
	}
	if (RequestInit.method && RequestInit.method !== "GET") {
		if (!RequestInit.headers) {
			RequestInit.headers = {
				'Content-Type': 'application/json',
			}
		}
	}

	RequestInit.credentials = 'include'

	return fetch(RequestInfo, RequestInit)
		.then(res => {
			if (res.ok) {
				return res.json()
			} else if (res.status === 401) {
				store.dispatch(logoutAction())
			}
			return res.json()
				.then(err => {
					if (err && err.error) {
						toast.error(err.error)
					} else {
						toast.error("Something went wrong, try again later")
					}
					console.error(err)
					throw err.error // Parse as json, then throw.
				})
		})
}

// ADMIN ROUTES

export let adminGetUsers = function () {
	return jsonFetch('/admin/users')
		.then(data => {
			store.dispatch(setUsers(data))
		})
}

export let adminCreateUser = function (user) {
	return jsonFetch('/admin/users', {
		method: 'POST',
		body: JSON.stringify(user)
	})
}

export let adminSetMultiplier = function (id, multiplier) {
	return jsonFetch(`/admin/users/${id}/set-multiplier`, {
		method: 'PUT',
		body: JSON.stringify({ multiplier })
	})
}

export let adminChangePass = function (id, password) {
	return jsonFetch(`/admin/users/${id}/change-password`, {
		method: 'PUT',
		body: JSON.stringify({ password })
	})
}

export let adminGiveCredits = function (id, quantity) {
	return jsonFetch(`/admin/users/${id}/add-credits`, {
		method: 'PUT',
		body: JSON.stringify({ quantity })
	})
}

// NORMAL ROUTES

export let getUser = function () {
	return jsonFetch('/me')
		.then(data => {
			store.dispatch(setUser(data))
		})
}

export let changePassword = function (current, newPassword) {
	return jsonFetch('/me/change-password', {
		method: 'POST',
		body: {
			passwordCurrent: current,
			passwordNew: newPassword,
		}
	})
}

export let getCredits = function () {
	return jsonFetch('/credits')
		.then(data => {
			store.dispatch(setCreditsAction(data.credits))
			return data
		})
}

// Returns { total: Number }
export let checkPrice = function (quantity) {
	return jsonFetch('/credits/check-price', {
		method: 'POST',
		body: JSON.stringify({ quantity }),
	})
}

// Use stripe to buy credits
// Returns { session: String }
export let buyCredits = function (quantity) {
	return jsonFetch('/credits/buy', {
		method: 'POST',
		body: JSON.stringify({ quantity }),
	})
}

export let getSongs = function () {
	return jsonFetch('/songs')
		.then(songs => {
			store.dispatch(setSongsAction(songs))
			return songs
		})
}

export let uploadSong = function (formData) {
	return jsonFetch('/songs', {
		method: 'POST',
		body: formData,
		headers: {
		}
	})
		.then(r => {
			getSongs()
			return r
		})
}

export let deleteSong = function (id) {
	return jsonFetch('/songs/' + id, {
		method: 'DELETE',
	})
}

export let getThread = function (thread, sort) {
	return jsonFetch(`/thread/${thread}?sort=${sort}`)
		.then(json => {
			let mapping = comment => {
				let newcomment = Object.assign({}, comment)

				if (Array.isArray(newcomment.replies)) {
					newcomment.replies = newcomment.replies.map(mapping)
				}

				return {
					enabled: false,
					data: newcomment
				}
			}

			let comments = json[1].map(mapping)

			store.dispatch(setQuestion(json[0]))
			store.dispatch(setComments(comments))

			return json
		})
}

export let getThemes = function () {
	return jsonFetch('/themes')
		.then(themes => {
			store.dispatch(setThemesAction(themes))
			return themes
		})
}

export let getTheme = function (themeId) {
	return jsonFetch('/themes/' + themeId)
}

export let createTheme = function (data) {
	return jsonFetch('/themes', {
		method: 'POST',
		body: JSON.stringify(data),
	})
}

export let editTheme = function (id, data) {
	return jsonFetch('/themes/' + id, {
		method: 'PUT',
		body: JSON.stringify(data),
	})
}

export let uploadThemeFiles = function (id, formData) {
	return jsonFetch('/themes/' + id + '/files', {
		method: 'POST',
		body: formData,
		headers: {
		}
	})
}

export let deleteTheme = function (id) {
	return jsonFetch('/themes/' + id, {
		method: 'DELETE',
	})
}

export let deleteThemeFile = function (id, body = { intro: false, transition: false, outro: false }) {
	return jsonFetch('/themes/' + id + '/files', {
		method: 'DELETE',
		body: JSON.stringify(body),
	})
}

export let longPollVideo = function (fileId) {
	return jsonFetch('/long-poll-video/' + fileId)
}

export let postPreview = function (theme, song) {
	return jsonFetch('/preview', {
		method: 'POST',
		body: JSON.stringify({
			options: {
				theme,
				song,
			}
		}),
	})
}

export let postRender = function () {
	let { question, processed, theme, song } = store.getState()

	if (!question.includeSelftext) {
		delete question.selftext_html
	}

	return jsonFetch('/videos', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			questionData: question,
			commentData: processed,
			options: {
				theme,
				song,
			},
		})
	})
}

export let _postRender = function (state) {
	let { questionData, commentData, options } = state

	if (!questionData.includeSelftext) {
		delete questionData.selftext_html
	}

	return jsonFetch('/videos', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			questionData,
			commentData,
			options,
		})
	})
}

export const getVideos = function () {
	return jsonFetch('/videos')
		.then(r => {
			store.dispatch(setVideosAction(r))
			return r
		})
}

export const openVideoLink = function (videoId) {
	return window.open('/videos/' + videoId, '_blank')
}

// btoa: Binary to Ascii (Base64 only contains ascii characters)

// Basic toBase64(username:password)
const toBasicAuth = (user, pass) => `Basic ${btoa(user + ':' + pass)}`

export let authorize = function (email, password) {
	return jsonFetch('/auth', {
		headers: new Headers({
			authorization: toBasicAuth(email, password),
		}),
		method: 'POST',
	}).then(r => {
		store.dispatch(loginAction())
		return r
	})
}

export let register = function (email, password) {
	return jsonFetch('/register', {
		body: JSON.stringify({ email, password }),
		method: 'POST',
	})
}

export let logout = function () {
	return jsonFetch('/logout').then(r => {
		store.dispatch(logoutAction())
	})
}
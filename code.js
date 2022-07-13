const custom = {
	async todoist(column) {
	
		//START config
		
		//how many items would you like to display
		let numberOfItems = 5
		
		//load only task for specific project
		//$ curl -X GET \ https://api.todoist.com/rest/v1/projects \ -H "Authorization: Bearer XYZ"
		const project_id = "1337" 
		
		//For "Basic" authentication the credentials are constructed by first combining the username and the password with a colon (aladdin:opensesame), 
		//and then by encoding the resulting string in base64 (YWxhZGRpbjpvcGVuc2VzYW1l).
		const bearer = "XYZ"
		
		//END config
		
		const url = "https://api.todoist.com/rest/v1/tasks?project_id="+project_id+"&filter=p1"
		const todoistPath = files.joinPath(files.libraryDirectory(), url+"todoist")
		let todoistData = code.getCache(todoistPath, 1, 1440)
		if (!todoistData || todoistData.cacheExpired) {
			try {
				let req = new Request(url)
				req.headers = {"Authorization":"Bearer "+bearer}
				let rawData = await req.loadJSON()
				
				todoistData = []
				for (item of rawData) {
					const listing = {}
					listing.title = item.content
					listing.link = item.url
					listing.prio = item.priority
					listing.isOverdue = false
					listing.dueDate = item.due ? new Date(item.due.date) : null
					todoistData.push(listing)
				}
				files.writeString(todoistPath, JSON.stringify(todoistData))
			} catch {}
		}
		
		const reminderSettings = code.settings.reminders

		if (typeof todoistData === 'object' && todoistData.length == 0) {
			if (reminderSettings.noRemindersBehavior == "message" && code.localization.noRemindersMessage.length) { 
				return code.provideText(code.localization.noRemindersMessage, column, code.format.noReminders, true) 
			}
			if (this[reminderSettings.noRemindersBehavior]) { 
				return await this[reminderSettings.noRemindersBehavior](column) 
			}
		}

		const reminderStack = column.addStack()
		reminderStack.layoutVertically()
		reminderStack.setPadding(0, 0, 0, 0)
		const settingUrl = reminderSettings.url || ""
		reminderStack.url = (settingUrl.length > 0) ? settingUrl : "x-apple-reminderkit://REMCDReminder/"

		const numberOfReminders = todoistData.length < numberOfItems ? todoistData.length : numberOfItems
		const showListColor = reminderSettings.showListColor
		const colorShape = showListColor.includes("circle") ? "circle" : "rectangle"

		for (let i = 0; i < numberOfReminders; i++) {
			const reminder = todoistData[i]

			const titleStack = code.align(reminderStack)
			titleStack.layoutHorizontally()	
			titleStack.url = "https://todoist.com/showTask"//reminder.link

			// TODO: Functionize for events and reminders
			if (showListColor.length && showListColor != "none" && !showListColor.includes("right")) {
				let colorItemText = code.provideTextSymbol(colorShape) + " "
				let colorItem = code.provideText(colorItemText, titleStack, code.format.reminderTitle)
				colorItem.textColor = Color.red()
			}

			const title = code.provideText(reminder.title.trim(), titleStack, code.format.reminderTitle)
			titleStack.setPadding(code.padding, code.padding, code.padding/5, code.padding)

			if (showListColor.length && showListColor != "none" && showListColor.includes("right")) {
				let colorItemText = " " + code.provideTextSymbol(colorShape)
				let colorItem = code.provideText(colorItemText, titleStack, code.format.reminderTitle)
				colorItem.textColor = Color.red()
			}

			if (reminder.isOverdue) { title.textColor = Color.red() }
			if (reminder.isOverdue || !reminder.dueDate) { continue }

			let timeText
			if (reminderSettings.useRelativeDueDate) {
				const rdf = new RelativeDateTimeFormatter()
				rdf.locale = code.locale
				rdf.useNamedDateTimeStyle()
				timeText = rdf.string(reminder.dueDate, code.now)

			} else {
				const df = new DateFormatter()
				df.locale = code.locale

				if (code.dateDiff(reminder.dueDate, code.now) == 0 && reminder.dueDateIncludesTime) { df.useNoDateStyle() }
				else { df.useShortTimeStyle() }

				if (reminder.dueDateIncludesTime ){ df.useShortTimeStyle() }
				else { df.useNoTimeStyle() }

				timeText = df.string(reminder.dueDate)
			}

			const timeStack = code.align(reminderStack)
			const time = code.provideText(timeText, timeStack, code.format.eventTime)
			timeStack.setPadding(0, code.padding, code.padding, code.padding)
		}
	}
}
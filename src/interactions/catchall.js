import { transcript, getInfoForUser } from '../utils'

const interactionCatchall = (bot, message) => {
  const { ts: timestamp, channel, user } = message

  getInfoForUser(user).then(({ slackUser }) => {
    if (slackUser.is_bot) {
      bot.replyInThread(message, transcript('catchall.botReply'))
    } else {
      if (Math.random() > 0.5) {
        bot.replyInThread(message, transcript('catchall.reply'))
      } else {
        bot.api.reactions.add(
          { timestamp, channel, name: transcript('catchall.emoji') },
          err => {
            if (err) console.error(err)
          }
        )
      }
    }
  })
}

export default interactionCatchall

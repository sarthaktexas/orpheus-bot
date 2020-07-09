import cheerio from 'cheerio'
import fetch from 'isomorphic-unfetch'

import { initBot, transcript } from '../utils'

const generateLink = file => {
  return new Promise((resolve, reject) => {
    initBot(true).api.files.sharedPublicURL({ file: file.id }, (err, res) => {
      if (err) {
        console.error(err)
        reject(err)
      }
      fetch(file.permalink_public + '?nojs=1')
        .then(r => r.text())
        .then(html => {
          const $ = cheerio.load(html)
          const link = $('a.file_header').href
          resolve(link)
        })
        .catch(e => reject(e))
    })
  })
}

const generateLinks = async files => {
  console.log('Generating links for ', files.length, 'file(s)')
  return await Promise.all(files.map(async f => await generateLink(f)))
}

const reaction = async (bot = initBot(), addOrRemove, channel, ts, name) => {
  return new Promise((resolve, reject) => {
    bot.api.reactions[addOrRemove](
      { channel, timestamp: ts, name },
      (err, res) => {
        if (err) {
          console.error('error while', addOrRemove, name, ':', err)
          reject(err)
        } else {
          resolve(name)
        }
      }
    )
  })
}

export default async (bot, message) => {
  const cdnChannelID = 'C016DEDUL87'
  const botSpamChannelID = 'C0P5NE354'

  const { ts, channel, files, user } = message
  if (channel != botSpamChannelID) {
    return
  }

  try {
    const results = {}
    await Promise.all([
      reaction(bot, 'add', channel, ts, 'beachball'),
      generateLinks(files)
        .then(f => {
          console.log(f)
          results.links = f
        })
        .catch(e => (results.error = e)),
      new Promise(resolve => setTimeout(resolve, 5000)), // minimum 5 seconds of loading
    ])
    console.log('results', results)
    if (results.error) {
      throw results.error
    }

    if (results.links) {
      await Promise.all([
        reaction(bot, 'remove', channel, ts, 'beachball'),
        reaction(bot, 'add', channel, ts, 'white_check_mark'),
        bot.replyInThread(
          message,
          transcript('fileShare.success', { links: results.links })
        ),
      ])
    }
  } catch (err) {
    await Promise.all([
      reaction(bot, 'remove', channel, ts, 'beachball'),
      reaction(bot, 'remove', channel, ts, 'white_check_mark'),
      reaction(bot, 'add', channel, ts, 'no_entry'),
      bot.replyInThread(message, transcript('errors.general', { err })),
    ])
  }
}
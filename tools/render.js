var timeout = 8000;

var Renderer = function(data, parent) {
  parent = parent.querySelector('tbody');

  var globalTotalMinutes = 0;
  var globalTotalEpisodes = 0;

  var render = function(chunk) {
    if (chunk === null) {
      console.log('No Data...');
      return;
    }
    var element = document.createElement('tr');

    var cover = document.createElement('td');
    cover.className = "cover";
    element.appendChild(cover);

    var title = document.createElement('td');
    title.className = "title";
    element.appendChild(title);

    var episodes = document.createElement('td');
    episodes.className = "episodes";
    element.appendChild(episodes);

    var episodeLength = document.createElement('td');
    episodeLength.className = "episodelength";
    element.appendChild(episodeLength);

    var totalLength = document.createElement('td');
    totalLength.className = "totallength";
    element.appendChild(totalLength);

    var stillWatching = document.createElement('td');
    stillWatching.className = "stillWatching";
    element.appendChild(stillWatching);

    if (chunk.votes) {
      var votes = document.createElement('td');
      votes.className = "votes";
      element.appendChild(votes);
    }


    if (chunk.title === 'TOTAL') {
      episodes.innerHTML = chunk.episodes;
    }

    if (chunk.poster) {
      cover.style.backgroundImage = 'url(' + chunk.poster + ')';
    } else {
      cover.style.backgroundImage = 'url(data/build/assets/covers/' + chunk.title.toLowerCase().replace(/[^A-Za-z0-9]/gi, '-') + '.jpg)';
    }

    if (chunk.episodeLength) {
      var length = chunk.episodeLength;
      episodeLength.innerHTML = length + 'min';
      var showTotalTime = length * chunk.episodes;
      totalLength.innerHTML = minToH(showTotalTime);
      // if(!chunk.votes) {
      //   incrementAll(showTotalTime);
      // }
    }

    if (chunk.imdb) {
      title.innerHTML = "<a href='http://www.imdb.com/title/" + chunk.imdb + "''>" + chunk.title + "</a>";
    } else {
      title.innerHTML = chunk.title;
    }

    if (chunk.votes) {
      // Donwload pilot of a new TV show
      title.innerHTML = '<a href="http://127.0.0.1:1337/' +
        chunk.title.replace(/\s/gi, '+') + '+/1/1/1"><img src="style/dwnld.png" class="download-icon"></a>' +
        title.innerHTML;
    }

    if (chunk.title === 'TOTAL') {

      episodes.innerHTML = chunk.episodes;

    } else if (!chunk.episodes) {
      renderEpisodes(episodes, chunk, '<img src="style/loader.gif">');
    } else {

      var episodesData = chunk.episodes + ' / <img src="style/loader.gif">';
      if (chunk.lastWatched) {
        episodesData = "<a class='last-watched' title='" + chunk.lastWatched +"'>" + episodesData + "</a>";
        episodes.dataset.lastWatched = chunk.lastWatched;
      }

      renderEpisodes(episodes, chunk, episodesData);
      episodes.dataset.episodes = chunk.episodes;

    }

    if (!chunk.totalTime) {
      episodeLength.innerHTML = chunk.episodeLength + "min";
      globalTotalEpisodes += parseInt(chunk.episodes, 10);
    }


    var totalMinutes;
    if (chunk.totalTime) {
      totalMinutes = chunk.totalTime
    } else {
      totalMinutes = chunk.episodes * chunk.episodeLength;
      globalTotalMinutes += totalMinutes;
      if (totalMinutes > 5999) {
        totalLength.classList.add('over-one-hundred');
      }
    }

    totalLength.innerHTML = ~~( totalMinutes / 60) + "h " +
        (totalMinutes%60 === 0 ? '' : totalMinutes%60 + "min");

    stillWatching.innerHTML = chunk.stillWatching ? "Yes" : "No";

    var addVoter = function(name) {
        votes.innerHTML += "<a href='https://github.com/" + name +
          "'><img src='data/build/assets/avatars/" + name + ".jpg' title='"+ name +"' class='voter'></a> ";
    }

    if (chunk.votes) {
      var votesContent = '';
      chunk.votes.forEach(function(voter) {
        addVoter(voter);
      });
    }

    parent.appendChild(element);
  }

  data.forEach(function(dataChunk) {
    render(dataChunk);
  });

  render({
    title: "TOTAL",
    episodes: globalTotalEpisodes,
    totalTime: globalTotalMinutes
  });

  globalTotalMinutes = globalTotalMinutes = 0;
};

var parseWikiResponse = function(data) {

  var id = data.id;
  var content = parseInt(data.content, 10);

  var element = document.getElementById(id);
  var episodes = element.dataset.episodes;
  var newData;

  clearTimeout(element.dataset.timeout);

  if (isNaN(content) && failed.indexOf(element.dataset.name) === -1) {
    WikiClient(element.dataset.name + ' (TV series)', id);
    failed.push(element.dataset.name);
    return;
  }

  if (episodes) {

    if (episodes >= content) {
      newData = episodes;
    } else {
      newData = episodes + ' / ' + content;
    }

    if (element.dataset.lastWatched) {
      newData = "<a class='last-watched' title='" + element.dataset.lastWatched +"'>" + newData + "</a>";
    }

    if (element.dataset.stillWatching == 1 && episodes < content) {
      // watching, not up to date

      var howManyLeft = content-episodes;
      element.parentNode.classList.add('red');
      element.previousSibling.innerHTML = '<a href="http://127.0.0.1:1337/' +
        element.dataset.name.replace(/\s/gi, '+') + createSearchURL(element.dataset.lastWatched) +
        '/' + howManyLeft + '"><img src="style/dwnld.png" class="download-icon"></a>' +
        element.previousSibling.innerHTML;

    } else if (element.dataset.stillWatching == 1 && episodes >= content) {
      // watching up to date!
      element.parentNode.classList.add('green');
    } else if (element.dataset.stillWatching == 0 && episodes >= content) {
      //not watching anymore, finished :(
      element.parentNode.classList.add('finished');
    } else if (element.dataset.stillWatching == 0 && episodes < content) {
      // not watching this shit anymore
      element.parentNode.classList.add('abandoned');
    }

  } else {
    newData = content;
  }

  element.innerHTML = newData;
}

var failed = [];

var noResponse = function(id) {
  var element = document.getElementById(id);
  var episodes = element.dataset.episodes;
  var newData = episodes || 0;

  if (element.dataset.lastWatched) {
    newData = "<a class='last-watched' title='" + element.dataset.lastWatched +"'>" + newData + "</a>";
  }

  element.innerHTML = newData;
}

var renderEpisodes = function(element, data, defaultValue) {
  element.dataset.name = data.title;
  element.dataset.stillWatching = data.stillWatching;
  element.innerHTML = defaultValue;
  element.id = Math.random().toString(36).slice(2).toUpperCase();

  WikiClient(data.wiki || data.title, element.id);

  element.dataset.timeout = setTimeout((function(id){
    return function() {
      noResponse(id);
    }
  })(element.id), timeout);
}

var createSearchURL = function(value) {
  var lw = value.split('E');
  lw[0] = lw[0].replace('S', '');
  lw[1] = parseInt(lw[1], 10);
  lw[1]++;
  return '/'+ lw.join('/');
}

var minToH = function(min) {
  return ~~( min / 60) + "h " +
    (min%60 === 0 ? '' : min%60 + "min");
}

var incrementAll = function(minutes) {
  var element = document.querySelector('tbody tr:last-child .totallength');
  var total = parseInt(element.dataset.minutes, 10) || 0;
  total += minutes;
  element.dataset.minutes = total;
  element.innerHTML = minToH(total);
}

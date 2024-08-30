module.exports = async ({github, context}) => {
  const query = `query($owner:String!, $name:String!, $issue_number:Int!) {
    repository(owner:$owner, name:$name){
      issue(number:$issue_number) {
        comments(first:5,orderBy:{direction:DESC, field:UPDATED_AT}) {
          nodes {
            author {
              avatarUrl(size: 24)
              login
              url
            }
            url
            bodyText
            updatedAt
          }
        }
      }
    }
  }`;
  const variables = {
    owner: context.repo.owner,
    name: context.repo.repo,
    issue_number: context.issue.number
  }
  const result = await github.graphql(query, variables)
  const renderComments = (comments) => {
    return comments.reduce((prev, curr) => {
      let sanitizedText = curr.bodyText.replace('<', '&lt;').replace('>', '&gt;').replace(/(\r\n|\r|\n)/g, "<br />").replace('|', '&#124;').replace('[', '&#91;');
      return `${prev}|[<img src="${curr.author.avatarUrl}" alt="${curr.author.login}" width="24" /><br />${curr.author.login}]  (${curr.author.url})|${new Date(curr.updatedAt).toLocaleString()}|${sanitizedText}|\n`;
    }, "| Name | Date | Message |\n|---|---|---|\n");
  };

  const fileSystem = require('fs');
  const readme = fileSystem.readFileSync('README.md', 'utf8');
  fileSystem.writeFileSync('README.md', readme.replace(/(?<=<!-- Guestbook -->.*\n)[\S\s]*?(?=<!-- \/Guestbook -->|$(?![\n]))/gm, renderComments(result.repository.issue.comments.nodes)), 'utf8');
}
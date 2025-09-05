using System.ComponentModel.DataAnnotations;

namespace UmaMusumeTournamentMaker.API.Application.DTOs
{
    /// <summary>
    /// DTO for starting the next round with all match winners
    /// </summary>
    public record StartNextRoundDto
    {
        [Required]
        public int TournamentId { get; set; }

        /// <summary>
        /// Tournament password for authorization
        /// </summary>
        [Required]
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// List of match results for the current round
        /// </summary>
        [Required]
        public List<MatchResultDto> MatchResults { get; set; } = new();
    }
}
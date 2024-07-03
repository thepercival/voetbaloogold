<?php

/**
 * @copyright	2007 Coen Dunnink
 * @license		http://www.gnu.org/licenses/gpl.txt
 * @version		$Id: Interface.php 580 2013-11-20 15:28:51Z thepercival $
 * @package		Voetbal
 */

/**
 * @package Voetbal
 */
interface Voetbal_Competition_Interface
{
	/**
	 * gets the Name
	 *
	 * @return 	string	the Name
	 */
	public function getName();
	/**
	 * puts the Name
	 *
	 * @param string $sName the Name which will be set
	 * @return 	null
	 */
	public function putName( $sName );
	/**
	 * gets the Abbreviation
	 *
	 * @return 	string	the Abbreviation
	 */
	public function getAbbreviation();
	/**
	 * puts the Abbreviation
	 *
	 * @param string $sAbbreviation the Abbreviation which will be set
	 * @return 	null
	 */
	public function putAbbreviation( $sAbbreviation );
	/**
	 * gets the Seasons
	 *
	 * @return 	Patterns_Collection	the Seasons
	 */
	public function getSeasons(): Patterns_Collection;
}
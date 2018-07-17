<?php

namespace DachcomBundle\Test\Test;

use Pimcore\Tests\Test\TestCase;
use DachcomBundle\Test\Helper\PimcoreBundle;

abstract class DachcomBundleTestCase extends TestCase
{
    /**
     * @return \Symfony\Component\DependencyInjection\ContainerInterface
     * @throws \Codeception\Exception\ModuleException
     */
    protected function getContainer()
    {
        /** @var \Pimcore $pimcoreModule */
        $pimcoreModule = $this->getModule('\\' . PimcoreBundle::class);
        return $pimcoreModule->getContainer();
    }
}